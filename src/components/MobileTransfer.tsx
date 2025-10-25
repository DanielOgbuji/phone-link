import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Container,
  Heading,
  Progress,
  Card,
  Spinner,
  Flex,
  Input,
  Center,
  Tabs,
  useBreakpointValue,
} from '@chakra-ui/react';
import { validateCode, getTransferSessionStatus, type ValidateCodeResponse, type TransferSessionStatus } from '../api/transfer';
import { toaster } from './ui/toaster';
import CodeInput from './CodeInput';
import QRScanner from './QRScanner';

type TransferState = 'input' | 'validating' | 'connected' | 'file-selection' | 'transferring' | 'completed' | 'error';

interface FileWithPreview {
  file: File;
  preview?: string;
}

const MobileTransfer: React.FC = () => {
  const [transferState, setTransferState] = useState<TransferState>('input');
  const transferStateRef = useRef<TransferState>(transferState);
  useEffect(() => { transferStateRef.current = transferState; }, [transferState]);

  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [bearerToken, setBearerToken] = useState<string>('');
  const [transferCode, setTransferCode] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const transferTimeoutRef = useRef<number | null>(null);

  // Responsive values for different screen sizes
  const containerMaxW = useBreakpointValue({ base: "sm" as const, md: "md" as const, lg: "lg" as const });
  const headingSize = useBreakpointValue({ base: "md" as const, md: "lg" as const });
  const buttonSize = useBreakpointValue({ base: "md" as const, md: "lg" as const });
  const spacing = useBreakpointValue({ base: 4, md: 6 });
  const cardMaxW = useBreakpointValue({ base: "100%", md: "400px" });

  // Additional responsive values for use in render functions
  const previewImageSize = useBreakpointValue({ base: "50px" as const, md: "60px" as const });
  const statusIconSize = useBreakpointValue({ base: "12px" as const, md: "16px" as const });
  const spinnerSize = useBreakpointValue({ base: "lg" as const, md: "xl" as const });
  const tabSize = useBreakpointValue({ base: "md" as const, md: "lg" as const });

  // Cleanup on unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // check if the websocket is closed and if we are in a state that needs a connection
        if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSED && (transferStateRef.current === 'connected' || transferStateRef.current === 'file-selection')) {
          console.log('Reconnecting WebSocket...');
          connectWithCode(transferCode);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (transferTimeoutRef.current) {
        clearTimeout(transferTimeoutRef.current);
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) { /* ignore */ }
      }
    };
  }, [transferCode]);

  const handleCodeSubmit = useCallback(async (code: string, token?: string) => {
    setTransferState('validating');
    setError('');
    setTransferCode(code);

    // If token is provided from QR scan, use it
    if (token) {
      setBearerToken(token);
      console.log('Using token from QR code');
    }

    try {
      // Skip HTTP validation and go directly to WebSocket like HTML file
      await connectWithCode(code);

    } catch (err) {
      setTransferState('input');
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate code';
      setError(errorMessage);

      toaster.create({
        title: 'Validation Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
        closable: true,
      });
    }
  }, [bearerToken]);

  // Connect with code using direct WebSocket approach like HTML file
  const connectWithCode = async (code: string) => {
    return retryWithBackoff(async () => {
      const wsUrl = 'wss://healthdocx-node.onrender.com/ws/transfer';
      const token = bearerToken || undefined;

      // Add token to WebSocket URL if provided (like HTML file)
      let urlToUse = wsUrl;
      if (token) {
        const sep = wsUrl.includes('?') ? '&' : '?';
        urlToUse = `${wsUrl}${sep}token=${encodeURIComponent(token)}`;
      }

      const ws = new WebSocket(urlToUse);
      wsRef.current = ws;

      return new Promise<any>((resolve, reject) => {
        // Connection timeout to guard against hanging attempts.
        connectionTimeoutRef.current = window.setTimeout(() => {
          reject(new Error('Connection timeout'));
          try { ws.close(); } catch (e) { /* ignore */ }
        }, 20000);

        ws.onopen = () => {
          console.log('WebSocket opened');
          // Clear the connection timeout on open (server may take time to respond; don't kill socket prematurely)
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }

          // Send join message like HTML file
          const joinPayload: any = {
            type: 'join_session',
            code: code,
            connectionType: 'mobile'
          };

          if (token) {
            joinPayload.token = token;
          }

          try {
            ws.send(JSON.stringify(joinPayload));
          } catch (e) {
            // failed to send join
            console.error('Failed to send join message', e);
          }
        };

        const onMessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received WebSocket message:', message);

            switch (message.type) {
              case 'session_joined':
                if (connectionTimeoutRef.current) {
                  clearTimeout(connectionTimeoutRef.current);
                  connectionTimeoutRef.current = null;
                }
                setSessionId(message.sessionId); // Store sessionId like HTML file
                setTransferState('connected');
                toaster.create({
                  title: 'Connected!',
                  description: 'Ready to send files',
                  type: 'success',
                  duration: 3000,
                });
                // keep this listener (it can handle other global messages), but resolve the connect promise
                resolve(message);
                break;

              case 'file_uploaded':
                console.log('File uploaded successfully');
                setTransferState('completed');
                setTransferProgress(100);
                toaster.create({
                  title: 'Transfer Complete',
                  description: 'File sent successfully!',
                  type: 'success',
                  duration: 5000,
                });
                break;

              case 'upload_error':
                console.log('Upload error:', message.message);
                // do not throw — handle gracefully
                setError(message.message || 'Upload failed');
                setTransferState('error');
                // don't reject the original promise here (it may already be resolved)
                break;

              case 'error':
                console.log('WebSocket error:', message.message);
                setError(message.message || 'Connection failed');
                setTransferState('error');
                break;

              default:
                console.log('Unknown message type:', message.type, message);
            }
          } catch (err) {
            console.error('WebSocket message error:', err);
            setError(err instanceof Error ? err.message : 'Connection failed');
            setTransferState('error');
            // If connection handshake hasn't resolved yet, reject
            reject(err);
          }
        };

        ws.addEventListener('message', onMessage);

        ws.onerror = (errorEvent) => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          console.error('WebSocket error:', errorEvent);
          reject(new Error('Connection failed'));
        };

        ws.onclose = (event) => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          console.log('WebSocket closed:', event.code, event.reason);
          // use ref to check current state
          if (transferStateRef.current === 'validating') {
            reject(new Error('Connection closed'));
          }
        };
      });
    }, 3, 1000); // 3 retries with 1 second initial delay
  };

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // central handler that accepts a File and processes validation + preview, then sets state
  const handleFileProcessing = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toaster.create({
        title: 'File Too Large',
        description: 'Please select a file smaller than 100MB',
        type: 'error',
        duration: 5000,
        closable: true,
      });
      return;
    }

    // If image, create preview first, then set state
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string | undefined;
        setSelectedFile({ file, preview });
        setTransferState('file-selection');
      };
      reader.onerror = () => {
        // If preview fails, still set file without preview
        setSelectedFile({ file });
        setTransferState('file-selection');
      };
      reader.readAsDataURL(file);
    } else {
      // non-image: set immediately
      setSelectedFile({ file });
      setTransferState('file-selection');
    }
  }, []);

  // keep original signature for input onChange — just delegate into handleFileProcessing
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // store file immediately to avoid browser clearing references during async ops
    handleFileProcessing(file);
  }, [handleFileProcessing]);

  const handleCameraCapture = useCallback(() => {
    // For now, use file input with camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // note: 'capture' may or may not behave consistently across browsers
    (input as any).capture = 'environment';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // don't fake an event; process the File directly
        handleFileProcessing(file);
      }
    };

    input.click();
  }, [handleFileProcessing]);

  const startFileTransfer = useCallback(async () => {
    if (!selectedFile || !wsRef.current || !sessionId) {
      setError('No file selected or connection not established');
      setTransferState('error');
      return;
    }

    // Check socket ready state
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('Connection lost. Please reconnect.');
      setTransferState('error');
      return;
    }

    setTransferState('transferring');
    setTransferProgress(0);

    // Wrap the entire transfer process with retry logic
    try {
      await retryWithBackoff(async () => {
        return new Promise<void>((resolve, reject) => {
          // Attach a temporary listener for transfer-specific messages
          const transferMessageHandler = (event: MessageEvent) => {
            try {
              const message = JSON.parse(event.data);
              console.log('File transfer message:', message);

              switch (message.type) {
                case 'file_uploaded':
                  console.log('File uploaded successfully');
                  setTransferState('completed');
                  setTransferProgress(100);
                  toaster.create({
                    title: 'Transfer Complete',
                    description: 'File sent successfully!',
                    type: 'success',
                    duration: 5000,
                  });
                  // remove this handler
                  ws.removeEventListener('message', transferMessageHandler);
                  // clear transfer timeout
                  if (transferTimeoutRef.current) {
                    clearTimeout(transferTimeoutRef.current);
                    transferTimeoutRef.current = null;
                  }
                  resolve(); // Resolve on success
                  break;

                case 'upload_error':
                  console.log('Upload error:', message.message);
                  // Remove handler and reject so retry can happen
                  ws.removeEventListener('message', transferMessageHandler);
                  if (transferTimeoutRef.current) {
                    clearTimeout(transferTimeoutRef.current);
                    transferTimeoutRef.current = null;
                  }
                  reject(new Error(message.message || 'Upload failed'));
                  break;

                case 'error':
                  console.log('WebSocket error:', message.message);
                  // Remove handler and reject so retry can happen
                  ws.removeEventListener('message', transferMessageHandler);
                  if (transferTimeoutRef.current) {
                    clearTimeout(transferTimeoutRef.current);
                    transferTimeoutRef.current = null;
                  }
                  reject(new Error(message.message || 'Transfer failed'));
                  break;

                default:
                  // let global handler deal with it
                  break;
              }
            } catch (err) {
              console.error('WebSocket message error during transfer:', err);
              ws.removeEventListener('message', transferMessageHandler);
              if (transferTimeoutRef.current) {
                clearTimeout(transferTimeoutRef.current);
                transferTimeoutRef.current = null;
              }
              reject(err);
            }
          };

          ws.addEventListener('message', transferMessageHandler);

          // Send file using existing connection (like HTML file does)
          sendFileDirect(ws, selectedFile.file).catch((sendError) => {
            // Handle WebSocket send failures
            console.error('Send file error:', sendError);
            ws.removeEventListener('message', transferMessageHandler);
            if (transferTimeoutRef.current) {
              clearTimeout(transferTimeoutRef.current);
              transferTimeoutRef.current = null;
            }
            reject(sendError);
          });

          // Set a timeout in case server doesn't respond
          transferTimeoutRef.current = window.setTimeout(() => {
            console.log('File transfer timeout');
            ws.removeEventListener('message', transferMessageHandler);
            if (transferTimeoutRef.current) {
              clearTimeout(transferTimeoutRef.current);
              transferTimeoutRef.current = null;
            }
            reject(new Error('Transfer timeout'));
          }, 60000); // 60 second timeout
        });
      }, 3, 1000); // 3 retries with 1 second initial delay

    } catch (err) {
      console.error('Transfer error after retries:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send file';
      setError(errorMessage);
      setTransferState('error');
      toaster.create({
        title: 'Transfer Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
        closable: true,
      });
    }
  }, [selectedFile, sessionId]);

  // Convert file to base64 (from HTML file logic)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          // Remove data:...base64, prefix to get just base64 data
          const parts = reader.result.split(',');
          const base64 = parts.length > 1 ? parts[1] : parts[0];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Send file using HTML file's approach - single send, not chunked
  const sendFileDirect = async (ws: WebSocket, file: File) => {
    // Ensure socket is open right before sending
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    // Generate unique file ID like HTML file
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Convert file to base64 like HTML file does
    const base64Data = await fileToBase64(file);

    console.log(`Sending file ${file.name} (${file.size} bytes, ${base64Data.length} base64 chars)`);

    // Show 50% progress while processing
    setTransferProgress(50);

    // Send entire file at once (like HTML file)
    const message = {
      type: 'file_upload',
      sessionId: sessionId, // Include sessionId like HTML file
      fileId: fileId,
      filename: file.name,
      mimeType: file.type,
      fileData: base64Data,
      fileSize: file.size
    };

    try {
      ws.send(JSON.stringify(message));
    } catch (e) {
      throw e;
    }

    // Show 100% after sending
    setTransferProgress(100);
  };

  const resetTransfer = useCallback(() => {
    setTransferState('input');
    setSelectedFile(null);
    setTransferProgress(0);
    setError('');
    setTransferCode('');
    setSessionId('');

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (transferTimeoutRef.current) {
      clearTimeout(transferTimeoutRef.current);
      transferTimeoutRef.current = null;
    }

    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) { /* ignore */ }
      wsRef.current = null;
    }
  }, []);

  // Send another file - keep connection active, just reset file state
  const sendAnotherFile = useCallback(() => {
    setTransferState('connected');
    setSelectedFile(null);
    setTransferProgress(0);
    setError('');
  }, []);

  // Utility function for retry with exponential backoff
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> => {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        console.log(`Attempting operation (attempt ${attempt + 1}/${maxRetries})`);
        return await fn();
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Operation failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('All retry attempts failed');
  };

  const renderInputState = () => (
    <VStack gap={6} w="full" maxW={cardMaxW} mx="auto" colorPalette="brand">
      <VStack gap={3}>
        <Heading size={headingSize} textAlign="center" color="primary">
          Send Files to Desktop
        </Heading>
        <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
          Enter the 6-digit code or scan the QR code from your desktop
        </Text>
      </VStack>

      {/* Bearer Token Input */}
      <Box w="full">
        <VStack gap={3}>
          <Text fontSize="sm" fontWeight="medium" textAlign="center">
            Bearer Token (Optional)
          </Text>
          <Input
            type="password"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="Enter your bearer token"
            size={buttonSize}
          />
          <Text fontSize="xs" textAlign="center">
            Leave empty if no authentication is required
          </Text>
        </VStack>
      </Box>

      {/* Tabs for Code Entry and QR Scanning */}
      <Box w="full">
        <Tabs.Root defaultValue="manual" variant="line" size={tabSize}>
          <Tabs.List>
            <Tabs.Trigger value="manual" flex="1">
              Manual Entry
            </Tabs.Trigger>
            <Tabs.Trigger value="qr" flex="1">
              QR Scanner
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="manual" p={6}>
            <VStack gap={4}>
              <Text fontSize="sm" textAlign="center">
                Enter the 6-digit code shown on your desktop
              </Text>
              <CodeInput
                onCodeSubmit={handleCodeSubmit}
                isLoading={transferState === 'validating'}
              />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="qr" p={6}>
            <VStack gap={4}>
              <Text fontSize="sm" textAlign="center">
                Scan the QR code displayed on your desktop
              </Text>
              <Box
                w="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <QRScanner
                  onQRCodeDetected={handleCodeSubmit}
                  isLoading={transferState === 'validating'}
                />
              </Box>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      {error && (
        <Box p={4} borderRadius="md">
          <Text fontSize="sm" textAlign="center">
            {error}
          </Text>
        </Box>
      )}
    </VStack>
  );

  const renderConnectedState = () => (
    <VStack gap={6} w="full" maxW={cardMaxW} mx="auto">
      <VStack gap={3}>
        <Box w={statusIconSize} h={statusIconSize} borderRadius="full" bg="green.400" />
        <Heading size={headingSize} textAlign="center">
          Connected Successfully!
        </Heading>
        <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
          Choose how you'd like to send your file
        </Text>
      </VStack>

      <VStack gap={4} w="full">
        <Button
          size={buttonSize}
          w="full"
          onClick={handleFileSelect}
        >
          Choose File
        </Button>

        <Button
          size={buttonSize}
          w="full"
          onClick={handleCameraCapture}
        >
          Take Photo
        </Button>
      </VStack>

      <Box>
        <label htmlFor="file-input" style={{ display: 'none' }}>
          Choose file to upload
        </label>
        <input
          id="file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Box>
    </VStack>
  );

  const renderFileSelectionState = () => (
    <VStack gap={6} w="full" maxW={cardMaxW} mx="auto">
      <VStack gap={3}>
        <Heading size={headingSize} textAlign="center">
          File Selected
        </Heading>
        <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
          Ready to send your file
        </Text>
      </VStack>

      {selectedFile && (
        <Card.Root w="full" maxW={{ base: "100%", md: "350px" }}>
          <Card.Body>
            <HStack gap={3}>
              <Box>
                {selectedFile.preview ? (
                  <img
                    src={selectedFile.preview}
                    alt={selectedFile.file.name}
                    style={{
                      width: previewImageSize,
                      height: previewImageSize,
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <Box
                    w={previewImageSize}
                    h={previewImageSize}
                    borderRadius="8px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  />
                )}
              </Box>
              <VStack gap={1} align="start" flex="1" minW="0">
                <Text fontWeight="medium" fontSize="sm" truncate>
                  {selectedFile.file.name}
                </Text>
                <Text fontSize="xs">
                  {(selectedFile.file.size / 1024 / 1024).toFixed(1)} MB
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      )}

      <VStack gap={4} w="full">
        <Button
          size={buttonSize}
          w="full"
          onClick={startFileTransfer}
        >
          Send File
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          w="full"
          onClick={() => setTransferState('connected')}
        >
          Choose Different File
        </Button>
      </VStack>
    </VStack>
  );

  const renderTransferringState = () => (
    <VStack gap={6} w="full" maxW={cardMaxW} mx="auto">
      <VStack gap={3}>
        <Spinner size={spinnerSize} />
        <Heading size={headingSize} textAlign="center">
          Sending File
        </Heading>
        <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
          Please wait while your file is being transferred...
        </Text>
      </VStack>

      <Box w="full" />

      <Button
        variant="outline"
        size={buttonSize}
        onClick={resetTransfer}
      >
        Cancel Transfer
      </Button>
    </VStack>
  );

  const renderCompletedState = () => (
    <VStack gap={6} w="full" maxW={cardMaxW} mx="auto">
      <VStack gap={3}>
        <Box w={statusIconSize} h={statusIconSize} borderRadius="full" bg="green.400" />
        <Heading size={headingSize} textAlign="center">
          Transfer Complete!
        </Heading>
        <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
          Your file has been sent successfully
        </Text>
      </VStack>

      <VStack gap={4} w="full">
        <Button
          size={buttonSize}
          w="full"
          onClick={sendAnotherFile}
        >
          Send Another File
        </Button>
      </VStack>
    </VStack>
  );

  const renderErrorState = () => (
    <VStack gap={6} w="full" maxW={cardMaxW} mx="auto">
      <VStack gap={3}>
        <Box w={statusIconSize} h={statusIconSize} borderRadius="full" bg="red.400" />
        <Heading size={headingSize} textAlign="center">
          Transfer Failed
        </Heading>
        <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
          {error || 'Something went wrong'}
        </Text>
      </VStack>

      <VStack gap={4} w="full">
        <Button
          size={buttonSize}
          w="full"
          onClick={resetTransfer}
        >
          Try Again
        </Button>
      </VStack>
    </VStack>
  );

  return (
    <Container maxW={containerMaxW} py={{ base: 4, md: 8 }}>
      <Flex minH="100vh" align="center" justify="center">
        <Box w="full" maxW="100%">
          {transferState === 'input' && renderInputState()}
          {transferState === 'validating' && (
            <VStack gap={6} w="full" maxW={cardMaxW} mx="auto">
              <Spinner size={spinnerSize} />
              <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>Validating code...</Text>
            </VStack>
          )}
          {transferState === 'connected' && renderConnectedState()}
          {transferState === 'file-selection' && renderFileSelectionState()}
          {transferState === 'transferring' && renderTransferringState()}
          {transferState === 'completed' && renderCompletedState()}
          {transferState === 'error' && renderErrorState()}
        </Box>
      </Flex>
    </Container>
  );
};

export default MobileTransfer;

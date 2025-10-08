import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Dialog,
  Portal,
  CloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { toaster } from './ui/toaster';

interface QRScannerProps {
  onQRCodeDetected: (code: string, token?: string) => void;
  isLoading?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onQRCodeDetected, isLoading = false }) => {
  const [error, setError] = useState<string>('');
  const { open, onOpen, onClose } = useDisclosure();

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
      console.log('QR Code detected:', result);

      // Check if it's the combined JWT:CODE format
      if (result.includes(':')) {
        const parts = result.split(':');
        if (parts.length === 2) {
          const token = parts[0]; // JWT token
          const code = parts[1];  // 6-digit code

          // Validate the code part
          if (code && /^\d{6}$/.test(code.trim())) {
            console.log('Combined format detected - Token:', token.substring(0, 20) + '...', 'Code:', code);
            onClose(); // Close the scanner
            onQRCodeDetected(code.trim(), token.trim());
            return;
          }
        }
      }

      // Check if it's a validate-code URL or direct code
      let code = result;

      // If it's a URL, extract the code from it
      if (result.includes('/validate-code')) {
        const url = new URL(result);
        code = url.searchParams.get('code') || url.pathname.split('/').pop() || '';
      }

      // Validate the extracted code
      if (code && /^\d{6}$/.test(code.trim())) {
        onClose(); // Close the scanner
        onQRCodeDetected(code.trim());
      } else {
        toaster.create({
          title: 'Invalid QR Code',
          description: 'The QR code does not contain a valid 6-digit code.',
          type: 'error',
          duration: 3000,
          closable: true,
        });
      }
    }
  };

  const handleError = (error: unknown) => {
    console.error('QR Scanner error:', error);
    setError('Failed to access camera. Please check permissions.');

    toaster.create({
      title: 'Camera Error',
      description: 'Unable to access camera. Please check permissions and try again.',
      type: 'error',
      duration: 5000,
      closable: true,
    });
  };



  return (
    <Box w="full" maxW="400px" mx="auto">
      <VStack gap={4}>
        <Text fontSize="lg" fontWeight="semibold" textAlign="center">
          Scan QR Code
        </Text>

        {error && (
          <Text color="red.500" fontSize="sm" textAlign="center" p={2} bg="red.50" borderRadius="md">
            {error}
          </Text>
        )}

        <VStack gap={3} w="full">
          <Button
            colorScheme="blue"
            size="lg"
            w="full"
            onClick={onOpen}
            loading={isLoading}
            loadingText="Starting camera..."
          >
            Open Camera Scanner
          </Button>
        </VStack>

        {/* QR Scanner Dialog */}
        <Dialog.Root open={open} onOpenChange={(e) => e.open ? onOpen() : onClose()} size="lg">
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Scan QR Code</Dialog.Title>
                </Dialog.Header>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
                <Dialog.Body pb={6}>
                  <VStack gap={4}>
                    <Box
                      w="full"
                      h="400px"
                      bg="black"
                      borderRadius="md"
                      overflow="hidden"
                      position="relative"
                    >
                      <Scanner
                        onScan={handleScan}
                        onError={handleError}
                        constraints={{
                          facingMode: 'environment' // Use back camera on mobile
                        }}
                        formats={['qr_code']} // Only scan QR codes
                        styles={{
                          container: {
                            width: '100%',
                            height: '100%',
                          },
                          video: {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          },
                        }}
                      />
                    </Box>

                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Position the QR code within the camera view to scan it automatically.
                    </Text>

                    <HStack gap={3}>
                      <Button colorScheme="red" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </VStack>
    </Box>
  );
};

export default QRScanner;

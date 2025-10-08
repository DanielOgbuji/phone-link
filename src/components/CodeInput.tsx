import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';

interface CodeInputProps {
  onCodeSubmit: (code: string) => void;
  isLoading?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ onCodeSubmit, isLoading = false }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const validateCode = (inputCode: string): boolean => {
    // Trim whitespace and validate format
    const trimmedCode = inputCode.trim();

    // Check if it's exactly 6 digits
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(trimmedCode)) {
      setError('Please enter a 6-digit code.');
      return false;
    }

    setError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow digits and limit to 6 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
    setCode(digitsOnly);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Extract only digits and trim whitespace
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 6);
    setCode(digitsOnly);

    if (error) {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCode(code)) {
      toaster.create({
        title: 'Invalid Code',
        description: error,
        type: 'error',
        duration: 3000,
        closable: true,
      });
      return;
    }

    onCodeSubmit(code);
  };

  return (
    <Box w="full" maxW="400px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <Text fontSize="lg" fontWeight="semibold" textAlign="center">
            Enter Pair Code
          </Text>

          <Input
            type="text"
            value={code}
            onChange={handleInputChange}
            onPaste={handlePaste}
            placeholder="Enter 6-digit code"
            maxLength={6}
            textAlign="center"
            fontSize="xl"
            fontWeight="bold"
            letterSpacing="wide"
            size="lg"
            autoFocus
            borderColor={error ? 'red.500' : undefined}
            _focus={{ borderColor: error ? 'red.500' : 'blue.500' }}
          />

          {error && (
            <Text color="red.500" fontSize="sm" textAlign="center">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            w="full"
            loading={isLoading}
            loadingText="Validating..."
            disabled={!code || code.length !== 6}
          >
            Connect
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default CodeInput;

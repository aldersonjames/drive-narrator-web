import React, { useEffect } from 'react';
import '@testing-library/jest-dom';
import { act, render, waitFor } from '@testing-library/react';

import {
  type VoiceInputController,
  type VoiceInputOptions,
  useVoiceInput,
} from '../../../src/hooks/useVoiceInput';

const createRecognitionMock = () => {
  const mock: Partial<SpeechRecognition> & {
    start: jest.Mock;
    stop: jest.Mock;
    abort: jest.Mock;
    onstart?: (event: SpeechRecognitionEvent) => void;
    onerror?: (event: SpeechRecognitionErrorEvent) => void;
    onresult?: (event: SpeechRecognitionEvent) => void;
    onend?: () => void;
  } = {
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
  };

  return mock as SpeechRecognition;
};

type HarnessProps = {
  options?: VoiceInputOptions;
  onReady: (controller: VoiceInputController) => void;
};

const Harness: React.FC<HarnessProps> = ({ options, onReady }) => {
  const controller = useVoiceInput(options);

  useEffect(() => {
    onReady(controller);
  }, [controller, onReady]);

  return null;
};

describe('useVoiceInput', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as typeof window & { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;
  });

  it('provides transcript updates and emits callbacks for final results', async () => {
    const recognition = createRecognitionMock();
    const onTranscript = jest.fn();
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = jest
      .fn(() => recognition)
      .mockName('SpeechRecognition');

    let controller: VoiceInputController | undefined;
    render(
      <Harness
        options={{ interimResults: true, onTranscript }}
        onReady={(ctrl) => (controller = ctrl)}
      />,
    );

    await waitFor(() => expect(controller).toBeDefined());

    await act(async () => {
      controller!.startListening();
    });

    expect(recognition.start).toHaveBeenCalled();

    act(() => {
      recognition.onstart?.({} as SpeechRecognitionEvent);
    });

    const event = {
      results: [
        [{ transcript: 'Hello' }],
        Object.assign([{ transcript: 'world' }], { isFinal: true }),
      ],
    } as unknown as SpeechRecognitionEvent;

    act(() => {
      recognition.onresult?.(event);
    });

    await waitFor(() => expect(controller?.transcript).toBe('Hello world'));
    expect(onTranscript).toHaveBeenLastCalledWith(
      expect.objectContaining({ transcript: 'Hello world', isFinal: true }),
    );
    expect(recognition.stop).toHaveBeenCalled();
  });

  it('handles permission errors gracefully', async () => {
    const recognition = createRecognitionMock();
    recognition.start.mockImplementation(() => {
      throw new DOMException('denied', 'NotAllowedError');
    });
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = jest.fn(
      () => recognition,
    );

    let controller: VoiceInputController | undefined;
    render(<Harness onReady={(ctrl) => (controller = ctrl)} />);

    await waitFor(() => expect(controller).toBeDefined());

    await act(async () => {
      controller!.startListening();
    });

    await waitFor(() => expect(controller?.error).toBe('Microphone permission denied'));
    expect(controller?.status).toBe('error');
  });

  it('falls back to webkitSpeechRecognition when standard API is unavailable', async () => {
    const recognition = createRecognitionMock();
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = undefined;
    (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
      jest.fn(() => recognition);

    let controller: VoiceInputController | undefined;
    render(<Harness onReady={(ctrl) => (controller = ctrl)} />);

    await waitFor(() => expect(controller).toBeDefined());

    await act(async () => {
      controller!.startListening();
    });

    expect(recognition.start).toHaveBeenCalled();
    expect(controller?.isSupported).toBe(true);
  });

  it('reports unsupported environments', async () => {
    delete (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as typeof window & { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;

    let controller: VoiceInputController | undefined;
    render(<Harness onReady={(ctrl) => (controller = ctrl)} />);

    await waitFor(() => expect(controller).toBeDefined());

    await act(async () => {
      controller!.startListening();
    });

    await waitFor(() => expect(controller?.error).toBe('Speech recognition not supported'));
    expect(controller?.isSupported).toBe(false);
  });
});

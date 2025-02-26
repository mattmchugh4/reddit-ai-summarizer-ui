'use client';

import { CompleteView, ErrorView, LoadingView, SearchView } from '@/components/HelperComponents';
import type { CommentData } from '@/components/MakeRequest';
import { useSocket } from '@/components/useSockets';
import { useCallback, useState } from 'react';

export enum AppState {
  Search = 'search',
  Loading = 'loading',
  Streaming = 'streaming',
  Complete = 'complete',
  Error = 'error',
}
export interface PostData {
  post_title: string;
  initial_post: string;
  post_date: string;
}

export default function SocketApp() {
  const [appState, setAppState] = useState<AppState>(AppState.Search);
  const [data, setData] = useState<CommentData | null>({ overall_summary: '' } as CommentData);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [postData, setPostData] = useState<PostData | null>(null);

  // useEffect(() => {
  //   const fetchSearchResults = async () => {
  //     try {
  //       const response = await fetch('http://localhost:5001/search', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ query: 'React tutorials' }), // Example query
  //       });

  //       if (!response.ok) {
  //         const errorData = await response.json();
  //         console.error('Error:', errorData.error || 'Failed to fetch results');
  //         return;
  //       }

  //       const data = await response.json();
  //       console.log('Search Results:', data.results);
  //     } catch (error) {
  //       console.error('Fetch error:', error.message);
  //     }
  //   };

  //   fetchSearchResults();
  // }, []);

  const resetState = useCallback(() => {
    setAppState(AppState.Search);
    setData({ overall_summary: '' } as CommentData);
    setStatusMessage('');
    setError('');
  }, []);

  const handleCommentData = useCallback((responseData: CommentData) => {
    setData(responseData);
    setAppState(AppState.Complete);
  }, []);

  const handlePostData = useCallback((data: PostData) => {
    setPostData(data);
  }, []);

  const handleStatusMessage = useCallback((message: string) => {
    setStatusMessage(message);
    if (message === 'Response complete') {
      setAppState(AppState.Complete);
    } else {
      setAppState(AppState.Loading);
    }
  }, []);

  const handleStreamResponse = useCallback((chunk: string) => {
    setData((prev) => ({
      ...prev,
      overall_summary: (prev?.overall_summary || '') + chunk, // Append streamed chunk to overall_summary
    }));
    setAppState(AppState.Streaming);
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setAppState(AppState.Error);
  }, []);

  const testConnection = () => {
    if (socket) {
      socket.emit('test', { message: 'This is a test message' });
    } else {
      console.error('Socket not connected');
    }
  };

  const { isConnected, socket } = useSocket(
    process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001',
    handleCommentData,
    handleStatusMessage,
    handleError,
    handleStreamResponse,
    handlePostData,
  );

  if (!isConnected) {
    return <div>Connecting to server...</div>;
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-start bg-gradient-to-b from-gray-100 to-gray-500">
      <div className="h-[5%]"></div>
      <h1 className="my-4 text-5xl font-bold text-[#FF7F50]">TL;DR: Reddit Thread Summarizer</h1>
      {appState === AppState.Search && (
        <SearchView socket={socket} onStart={() => setAppState(AppState.Loading)} />
      )}
      {statusMessage && statusMessage !== 'Response complete' && (
        <div>
          <span className="text-md block italic text-black">{statusMessage}</span>
        </div>
      )}
      {appState === AppState.Loading && <LoadingView />}

      {(appState === AppState.Streaming || appState === AppState.Complete) && data && (
        <CompleteView data={data} postData={postData} resetState={resetState} />
      )}
      {appState === AppState.Error && <ErrorView error={error} />}
    </div>
  );
}

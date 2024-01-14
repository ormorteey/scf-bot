import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight'
import * as Popover from '@radix-ui/react-popover';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import { ThumbsDown, ThumbsUp, Clipboard, Trash } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown';
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { CodeBlock, Pre } from '@/components/ui/Code';
// Import the theme of your choice


export default function Home() {
  const [time, setTime] = useState('');
  const [query, setQuery] = useState<string>('');
  const chatWindowRef = useRef<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to learn about Soroban?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  const initialState = {
    messages: [
      {
        message: 'Hi, what would you like to learn about Soroban?',
        type: 'apiMessage' as 'apiMessage',
      },
    ],
    history: [],
  };


  const { messages, history } = messageState;


  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const options = { code: CodeBlock, pre: Pre, }

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();
    scrollToBottom();
    getCurrentTime()

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
        }),
      });
      const data = await response.json();
      console.log('data', data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }
      console.log('messageState', messageState);

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
      requestAnimationFrame(() => scrollToBottom());
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
    scrollToBottom();
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      const chatWindow = chatWindowRef.current;

      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight + 300;
      }
    }, 0);
  };

  const cleanContent = (content: any) => {
    // Check if the content starts and ends with triple backticks for code blocks
    if (content.startsWith('```') && content.endsWith('```')) {
      // Remove the first and last lines which contain the backticks
      const lines = content.split('\n');
      if (lines.length > 2) {
        return lines.slice(1, -1).join('\n');
      }
    }
    // If not wrapped in backticks or just single line, return as is
    return content;
  };

  const handleCopy = async (message: string) => {
    try {
      const contentToCopy = cleanContent(message);
      await navigator.clipboard.writeText(contentToCopy);
      console.log('Message copied to clipboard');
    } catch (err) {
      console.error('Failed to copy message: ', err);
    }
  };


  function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes: any = now.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    setTime(hours + ':' + minutes);
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-white relative">
      <div className="flex items-center gap-x-2 py-5 px-5 bg-gray-100 border-b border-gray-300">
        <Image
          src="/soroban.jpeg"
          alt="AI"
          width="40"
          height="40"
          className={`${styles.boticon} !rounded-xl`}
          priority
        />
        <h1 className='text-2xl font-bold leading-[1.1] tracking-tighter text-center text-stone-700'>Soroban Documentation AI Assistant</h1>

      </div>
      <div className='flex rounded-sm max-w-[97%] m-1.5 bg-zinc-100 text-xs text-gray-500 p-1.5'>
        <p>This AI assistant provides quick access to Soroban features, SDK, and RPC. It may not always fully grasp the context of your inquiries. In such instances, please drop by our <a className='font-semibold' href='https://discord.com/invite/YMe3eqf69M'>community chat discord</a> for further assistance.</p>
      </div>
      {
        !query && <div className='flex items-center gap-x-5 p-2'>
          <p className='text-xs text-stone-700 font-semibold pt-0.5'>Ask me questions like:</p>
          <div className='flex gap-x-2 '>
            {/* <button onClick={() => setQuery('Why Soroban?')} className="px-2.5 bg-zinc-100 rounded-xl md:text-sm text-xs border border-gray-400">Why Soroban?</button> */}
            <button onClick={() => setQuery(`What's the Soroban-RPC?`)} className="px-2.5 bg-zinc-100 rounded-md md:text-sm text-xs border border-gray-400">What&apos;s the Soroban-RPC</button>
            <button onClick={() => setQuery(`What's the assert_with_error module?`)} className="px-2.5 bg-zinc-100 rounded-md md:text-sm text-xs border border-gray-400">What&apos;s the assert_with_error module?</button>
          </div>
        </div>
      }
      <main ref={chatWindowRef} className={`${styles.main} w-full p-2 overflow-y-scroll no-scrollbar`}>
        <div className={`${styles.cloud}`}>
          <div ref={messageListRef} className={`${styles.messagelist}`}>
            {messages.map((message, index) => {
              let icon;
              let className;
              if (message.type === 'apiMessage') {
                // icon = (
                //   <Image
                //     key={index}
                //     src="/Soroban.jpg"
                //     alt="AI"
                //     width="40"
                //     height="40"
                //     className={`${styles.boticon} !rounded-xl`}
                //     priority
                //   />
                // );
                className = styles.apimessage;
              } else {
                // icon = (
                //   <Image
                //     key={index}
                //     src="/user.png"
                //     alt="Me"
                //     width="30"
                //     height="30"
                //     className={`${styles.usericon} rounded-xl ring-2 ring-green-500 p-1`}
                //     priority
                //   />
                // );
                // The latest message sent by the user will be animated while waiting for a response
                className =
                  loading && index === messages.length - 1
                    ? styles.usermessagewaiting
                    : styles.usermessage;
              }
              return (
                <>
                  <div key={`chatMessage-${index}`} className={`${className} ${message.type === 'apiMessage' ? 'bg-zinc-100 text-stone-700 px-2 min-w-[80%] max-w-[85%] rounded-t-lg mr-auto' : 'bg-zinc-100 !text-stone-700  px-2 mr-2.5 min-w-md max-w-md !border-none rounded-lg ml-auto my-2'}`}>
                    {icon}
                    <div className={styles.markdownanswer}>
                      {/* <div className={` text-sm font-normal leading-7 pl-1`}> */}
                      {/* <Markdown
                        className='prose prose-invert text-sm text-gray-900 font-normal leading-7 pl-1'
                        components={options}
                      >
                        {message.message}
                      </Markdown> */}
                      <ReactMarkdown linkTarget="_blank">
                        {message.message}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {/* <span className={`text-[10px] flex -mt-1.5  text-gray-800 ${message.type === 'apiMessage' ? 'hidden' : 'justify-end mr-2'} `}>{time}</span> */}

                  {
                    message.sourceDocs &&
                    <div className='bg-gray-100 flex flex-col border-t-gray-200 border-t text-left min-w-[80%] max-w-[85%] rounded-b-lg px-2 p-2'>
                      <p className='font-bold text-stone-700 text-xs py-1'>Sources:</p>
                      <div className='flex md:flex-row flex-col justify-between'>
                        <div className='grid md:grid-cols-4 grid-cols-2 gap-x-2 cursor-pointer'>
                          {message.sourceDocs
                            .reduce<Document[]>((unique, doc) => {
                              if (!unique.find(item => item.metadata?.source === doc.metadata?.source)) {
                                unique.push(doc);
                              }
                              return unique;
                            }, [])
                            .map((doc, index) => (
                              <a key={index} href={doc.metadata?.source} className="text-xs">
                                <span className='font-semibold'>{index + 1}. </span>
                                <span className='underline !text-stone-700'>{doc.metadata?.title}</span>
                              </a>
                            ))
                          }
                        </div>


                        <div className='flex gap-x-2  md:mt-0 mt-5'>
                          <button onClick={() => handleCopy(message.message)} className=" hover:bg-gray-200"><Clipboard size={14} /></button>
                          <button onClick={() => setMessageState(initialState)} className="hover:bg-gray-200"><Trash size={14} /></button>
                          <button className="hover:bg-gray-200"><ThumbsUp size={14} /></button>
                          <button className="hover:bg-gray-200"><ThumbsDown size={14} /></button>
                        </div>
                      </div>
                    </div>
                  }
                </>
              );
            })}
          </div>
        </div>
      </main>
      <div className='absolute bottom-0 bg-white px-1'>
        <div className={`${styles.center} pt-1`}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                id="userInput"
                name="userInput"
                placeholder={
                  loading
                    ? 'Waiting for response...'
                    : 'What is Soroban?'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
              >
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <LoadingDots color="#000" />
                  </div>
                ) : (
                  // Send icon SVG in input field
                  <svg
                    viewBox="0 0 20 20"
                    className={styles.svgicon}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500">Powered by <a className='text-gray-600' target="_blank" href='https://www.interactif.ai/'>InteractifAI</a></p>
        {error && (
          <div className="border border-red-400 rounded-md p-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { question, history } = req.body;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Check' });
    return;
  }

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }

  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE,
      },
    );

    const retriever = vectorStore.asRetriever();
    const chain = makeChain(retriever);

    const pastMessages = history
      .map((message: [string, string]) => {
        return [`Human: ${message[0]}`, `Assistant: ${message[1]}`].join('\n');
      })
      .join('\n');

    const response = await chain.invoke({
      question: sanitizedQuestion,
      chat_history: pastMessages,
    });

    res.status(200).json({ text: response });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}

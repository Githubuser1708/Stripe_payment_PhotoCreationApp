/**
 * Client-side service calling server API routes
 */

export const generatePreWeddingPhoto = async (
  referenceImages: { base64: string; mimeType: string }[],
  styleDescription: string,
  customPrompt?: string
): Promise<{imageUrl: string, imageId: string}> => {
  const res = await fetch('/api/generate-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referenceImages,
      styleDescription,
      customPrompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate photo.');
  }

  if (!data.imageUrl) {
    throw new Error('No image returned from server.');
  }

  return { imageUrl: data.imageUrl, imageId: data.imageId };
};

export const editImage = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const res = await fetch('/api/edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      prompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to edit image.');
  }

  if (!data.imageUrl) {
    throw new Error('No edited image returned from server.');
  }

  return data.imageUrl;
};

export const sendChatMessage = async (
  history: { role: string; text: string }[],
  message: string
): Promise<string> => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get chat response.');
  }

  return data.text || '';
};

const fs = require('fs');

// 1. Update geminiService.ts
let serviceCode = fs.readFileSync('services/geminiService.ts', 'utf8');
serviceCode = serviceCode.replace(
  '): Promise<string> => {',
  '): Promise<{imageUrl: string, imageId: string}> => {'
);
serviceCode = serviceCode.replace(
  'return data.imageUrl;',
  'return { imageUrl: data.imageUrl, imageId: data.imageId };'
);
fs.writeFileSync('services/geminiService.ts', serviceCode);

// 2. Update PreWeddingGen.tsx
let genCode = fs.readFileSync('components/PreWeddingGen.tsx', 'utf8');

genCode = genCode.replace(
  'const [generatedImage, setGeneratedImage] = useState<string | null>(null);',
  'const [generatedImage, setGeneratedImage] = useState<string | null>(null);\n  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);'
);

genCode = genCode.replace(
  'setGeneratedImage(null);',
  'setGeneratedImage(null);\n    setGeneratedImageId(null);'
);

genCode = genCode.replace(
  'const result = await generatePreWeddingPhoto(',
  'const resultObj = await generatePreWeddingPhoto('
);

genCode = genCode.replace(
  'setGeneratedImage(result);',
  'setGeneratedImage(resultObj.imageUrl);\n      setGeneratedImageId(resultObj.imageId);'
);

genCode = genCode.replace(
  'onGenerateSuccess(result);',
  'onGenerateSuccess({ preview: resultObj.imageUrl, imageId: resultObj.imageId });'
);

// We need to update the interface PreWeddingGenProps as well
genCode = genCode.replace(
  'onGenerateSuccess?: (url: string) => void;',
  'onGenerateSuccess?: (data: { preview: string, imageId: string }) => void;'
);

// Change the checkout body in PreWeddingGen.tsx
genCode = genCode.replace(
  'body: JSON.stringify({ imageId: generatedImage }),',
  'body: JSON.stringify({ imageId: generatedImageId }),'
);

fs.writeFileSync('components/PreWeddingGen.tsx', genCode);

// 3. Update App.tsx
let appCode = fs.readFileSync('App.tsx', 'utf8');
// The archived photos need to store an object { preview, imageId } instead of just string
appCode = appCode.replace(
  'const [archivedPhotos, setArchivedPhotos] = useState<string[]>([]);',
  'const [archivedPhotos, setArchivedPhotos] = useState<{preview: string, imageId: string}[]>([]);'
);
appCode = appCode.replace(
  'onGenerateSuccess={(url) =>',
  'onGenerateSuccess={(data) =>'
);
appCode = appCode.replace(
  'setArchivedPhotos((prev) => [url, ...prev])',
  'setArchivedPhotos((prev) => [data, ...prev])'
);

// Map render
appCode = appCode.replace(
  'archivedPhotos.map((url, i) => (',
  'archivedPhotos.map((photo, i) => ('
);
appCode = appCode.replace(
  'src={url}',
  'src={photo.preview}'
);
appCode = appCode.replace(
  'body: JSON.stringify({ imageId: url }),',
  'body: JSON.stringify({ imageId: photo.imageId }),'
);

fs.writeFileSync('App.tsx', appCode);
console.log('Successfully patched frontend files');

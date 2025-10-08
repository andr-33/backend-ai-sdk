import express, { Request, Response } from 'express';
import 'dotenv/config';
import { GoogleGenAI, Modality } from '@google/genai';

const app = express();
app.use(express.json({ limit: '10mb' }));

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable is not set');
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const PROMPT = `Analyze the people in this photo and creatively edit it with a strong Miami Dolphins fan theme. 
1. Make the people in the photo appear to be wearing Miami Dolphins merchandise...
2. Add the likeness of Miami Dolphins QB Tua Tagovailoa...
3. Ensure the edits are well-integrated...
4. The final image should be a fun, high-energy fan photo...
5. Change the background so it appears outside the Miami Dolphins stadium.
`;

app.post('/edit-image', async (req: Request, res: Response) => {
  try {
    const { base64Image, mimeType } = req.body;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: 'base64Image and mimeType are required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: PROMPT },
        ],
      },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return res.json({ editedImage: imagePart.inlineData.data });
    }

    if (response.text) {
      return res.status(500).json({ error: `Model returned text instead of image: ${response.text}` });
    }

    res.status(500).json({ error: 'No image returned from model' });

  } catch (err) {
    console.error('Error calling Gemini API:', err);
    res.status(500).json({ error: 'Error communicating with Gemini API' });
  }
});

app.listen(8080, () => {
  console.log('Server listening on port 8080');
});
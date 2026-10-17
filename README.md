1. Sampling and Quantization

<!-- Edge based segmentation -->
<!-- Detects object boundaries based on intensity changes. EXAMPLE:Shape detection, contour extraction, feature recognition. -->

2. Derivative-Based Edge Detection

3. Canny Edge Detection

4. Morphology-Based Edge Detection 

<!-- Region based segmentation -->
<!-- Groups pixels into regions based on similarity (e.g., color, texture, intensity). EXAMPLE:Medical imaging, scene segmentation, region analysis. -->

5. Region Growing Segmentation

6. Region Splitting and Merging Segmentation

7. Watershed-Based Image Segmentation

<!-- Image compression -->

8. Run-Length Encoding for Image Compression

9. Huffman Coding for Lossless Image Compression

10. Sine and Cosine Transform-Based Image Compression

11. JPEG Image Compression Technique


<!-- 
Add recorded-audio playback for the Aim, Theory, and Procedure pages of this experiment:

Experiment folder: [PATH TO EXPERIMENT FOLDER]
Aim page: [AIM HTML FILE]
Theory page: [THEORY HTML FILE]
Procedure page: [PROCEDURE HTML FILE]
Existing shared player template: [PATH TO textToSpeech.js]
Timestamp file: [PATH TO textToSpeech.json]

First inspect the existing HTML, JavaScript, CSS, audio files, and timestamp data. Reuse the project’s existing `textToSpeech.js` player pattern and conventions wherever practical. Keep changes focused, preserve each page’s design and structure, and do not duplicate the shared player for individual pages.

Requirements:
- Remove browser speech synthesis (`speechSynthesis` and `SpeechSynthesisUtterance`) from these pages. Do not use browser TTS as a fallback.
- Play the supplied recorded audio files. Use the actual files and paths found in the project; do not invent filenames or paths.
- Provide Play/Pause, Previous Sentence, Next Sentence, and playback-speed controls. If controls already exist, preserve them and add only what is missing.
- Keep the transcript text divided into sentences. Clicking a sentence should seek to its timestamp and play from there.
- Highlight the sentence whose timestamp range contains the current playback time. Update the highlight during playback and clear it appropriately when paused, completed, or when playback fails.
- Previous/Next should navigate across sentence order, including across paragraph or audio-file boundaries where appropriate. Disable navigation only at the true beginning or end of the available transcript.
- Playback speed must change the recorded audio’s `playbackRate`. Preserve the selected speed when switching to another sentence or loading the next audio file; do not reset it to 1x.
- Where a page has multiple recordings in sequence, finishing one recording should automatically start the next recording, unless the project’s existing behavior clearly specifies otherwise.
- Handle audio loading, playback errors, seeking, pause/resume, and completion without stale highlights or incorrect button states.
- Keep audio-path resolution and timestamp lookup in the shared player/helper. Do not scatter paths or timestamp logic throughout the HTML.
- Reuse the project’s existing timestamp JSON format. Use one `{ "start": number, "end": number }` entry per sentence, in seconds from the start of that audio file. Keep unavailable timings as `{ "start": null, "end": null }`; do not guess or generate timings unless I specifically ask.
- Ensure the audio keys in the HTML, timestamp JSON, and player configuration match the corresponding recording basenames. Use clear, consistent names such as:
  - `1.para.aim.wav` → JSON key `"1.para.aim"`
  - `1.para.intro.wav` → JSON key `"1.para.intro"`
  - `2.para.edge-segmentation.mp3` → JSON key `"2.para.edge-segmentation"`
  Adapt names and audio extensions to the actual files provided.
- Do not remove unrelated page functionality or make unrelated changes.

After implementation:
1. Check that every configured transcript key has a matching timestamp array and recording.
2. Check that each timestamp array has exactly one entry per displayed sentence.
3. Run the available syntax, lint, build, or test checks.
4. If possible, open the pages in a browser and verify playback, sentence highlighting, navigation, speed changes, and automatic continuation between recordings.
5. Summarize changed files and validation results. List the audio filename/key pairs that still need recordings or real timestamps. -->

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

const { desktopCapturer } = window.require('electron');
const { Menu, MenuItem, dialog } = window.require('@electron/remote');
const { writeFile } = window.require('fs');

let mediaRecorder; // Mediarecorder instance to capture video
let recorderChunks = [];

async function getVideoSources() {
	const inputSources = await desktopCapturer.getSources({ types: ['window', 'screen'] });

	const videoOptions = Menu.buildFromTemplate(inputSources.map(source => {
		return new MenuItem({
			label: source.name,
			click: () => selectSource(source)
		})
	}));

	videoOptions.popup();
}

async function selectSource(source) {
	videoSelectBtn.innerHTML = source.name;

	const constraints = {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id
			}
		}
	};

	const stream = await navigator.mediaDevices.getUserMedia(constraints);

	videoElement.srcObject = stream;
	videoElement.play();

	const options = { mimeType: 'video/webm; codecs=vp9' };
	mediaRecorder = new MediaRecorder(stream, options);

	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.onstop = handleStop;
}

startBtn.onclick = e => {
	if(mediaRecorder) {
		mediaRecorder.start();
		startBtn.classList.remove('green');
		startBtn.classList.add('blue');
		startBtn.innerHTML = 'Recording...'
	}
}

stopBtn.onclick = e => {
	if(mediaRecorder) {
		mediaRecorder.stop();
		startBtn.innerHTML = 'Record';
	}
}

function handleDataAvailable(e) {
	recorderChunks.push(e.data);
}

async function handleStop(e) {
	const blob = new Blob(recorderChunks, { type: 'video/webm; codecs=vp9' });

	const buffer = Buffer.from(await blob.arrayBuffer());

	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'Save Video',
		defaultPath: `screenrecord-${Date.now()}.webm`
	});

	writeFile(filePath, buffer, () => console.log('File has been saved successfully'))
}
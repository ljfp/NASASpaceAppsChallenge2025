// Extracted from aladin.html, should contain the buttons and logic for
// mark adding and some other stuff
const { A } = window;
if (!A) {
	console.error('Aladin Lite library failed to load.');
}

const statusMessage = document.getElementById('status-message');
const errorBox = document.getElementById('aladin-error');
const fileInput = document.getElementById('fits-file');
const urlInput = document.getElementById('fits-url');
const loadUrlButton = document.getElementById('load-url');
const sampleButtons = Array.from(document.querySelectorAll('[data-fits-url]'));
const addMarkerButton = document.getElementById('add-marker');
const removeMarkerButton = document.getElementById('remove-marker');
const markerModal = document.getElementById('marker-modal');
const markerForm = markerModal ? markerModal.querySelector('form') : null;
const markerCancelButton = markerModal ? markerModal.querySelector('[data-action="cancel"]') : null;
const markerTitleInput = document.getElementById('marker-title');
const markerDescriptionInput = document.getElementById('marker-description');
const markerColorInput = document.getElementById('marker-color');

let aladinInstance = null;
let currentRequestId = 0;
let markerLayer = null;
let markerMode = 'idle';
let pendingMarkerPosition = null;
let storedStatusText = null;
const placedMarkers = [];
let lastStatusSnapshot = { label: null, fov: null };

if (addMarkerButton) {
	addMarkerButton.disabled = true;
}
if (removeMarkerButton) {
	removeMarkerButton.disabled = true;
}

const DEFAULT_SAMPLE = sampleButtons.length
	? {
			url: sampleButtons[0].dataset.fitsUrl,
			label: sampleButtons[0].dataset.label,
			colormap: sampleButtons[0].dataset.colormap
	  }
	: null;

function createMarkerIcon(color) {
	const size = 22;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) {
		return canvas;
	}
	const normalizedColor = typeof color === 'string' && color.trim() ? color : '#60A5FA';
	context.clearRect(0, 0, size, size);
	context.beginPath();
	context.arc(size / 2, size / 2, (size / 2) - 2, 0, Math.PI * 2);
	context.closePath();
	context.fillStyle = normalizedColor;
	context.fill();
	context.lineWidth = 2;
	context.strokeStyle = '#0f172a';
	context.stroke();
	context.beginPath();
	context.arc(size / 2, size / 2, 3, 0, Math.PI * 2);
	context.closePath();
	context.fillStyle = '#0f172a';
	context.fill();
	return canvas;
}

function showError(message) {
	errorBox.textContent = message;
	errorBox.classList.remove('hidden');
}

function clearError() {
	errorBox.textContent = '';
	errorBox.classList.add('hidden');
}

function updateStatus(label, fov) {
	lastStatusSnapshot = {
		label: label ?? null,
		fov: Number.isFinite(fov) ? fov : null
	};
	const parts = [];
	if (label) {
		parts.push(`Source: ${label}`);
	}
	if (Number.isFinite(fov)) {
		const span = Math.max(0.01, fov * 2);
		parts.push(`FoV ≈ ${span.toFixed(2)}°`);
	}
	statusMessage.textContent = parts.join(' · ') || 'Ready to load a FITS image.';
}

function setTemporaryStatus(message) {
	if (storedStatusText === null) {
		storedStatusText = statusMessage.textContent;
	}
	statusMessage.textContent = message;
}

function restoreStatus() {
	if (storedStatusText !== null) {
		statusMessage.textContent = storedStatusText;
		storedStatusText = null;
	} else {
		updateStatus(lastStatusSnapshot.label, lastStatusSnapshot.fov);
	}
}

function focusOnImage(ra, dec, fov) {
	if (Number.isFinite(ra) && Number.isFinite(dec)) {
		aladinInstance.gotoRaDec(ra, dec);
	}
	if (Number.isFinite(fov)) {
		const clamped = Math.min(60, Math.max(0.01, fov * 2));
		aladinInstance.setFoV(clamped);
	}
}

function configureImage(image, colormap) {
	if (!image) {
		return;
	}
	try {
		image.setColormap(colormap || 'magma', { stretch: 'sqrt' });
	} catch (error) {
		console.warn('Unable to update the FITS colormap', error);
	}
}

function deriveLabel(source) {
	if (typeof source === 'string') {
		try {
			const url = new URL(source);
			return url.hostname;
		} catch {
			return source;
		}
	}
	if (source && typeof source.name === 'string') {
		return `Local file: ${source.name}`;
	}
	return 'Custom FITS';
}

function ensureMarkerLayer() {
	if (!aladinInstance || markerLayer) {
		return markerLayer;
	}
	markerLayer = A.catalog({
		name: 'Annotations',
		shape: 'circle',
		sourceSize: 18,
		color: '#60A5FA'
	});
	aladinInstance.addCatalog(markerLayer);
	return markerLayer;
}

function updateRemoveMarkerState() {
	if (removeMarkerButton) {
		removeMarkerButton.disabled = placedMarkers.length === 0;
	}
}

function exitMarkerFlow() {
	markerMode = 'idle';
	if (addMarkerButton) {
		addMarkerButton.classList.remove('marker-control--active');
		addMarkerButton.disabled = !aladinInstance;
	}
	pendingMarkerPosition = null;
	restoreStatus();
}

function openMarkerModal() {
	if (!markerModal || !markerForm) {
		return;
	}
	markerModal.classList.remove('hidden');
	if (markerTitleInput) {
		markerTitleInput.focus();
	}
	document.addEventListener('keydown', handleModalKeydown);
}

function resetMarkerForm() {
	if (!markerForm) {
		return;
	}
	markerForm.reset();
	if (markerColorInput) {
		markerColorInput.value = '#60A5FA';
	}
}

function closeMarkerModal() {
	if (!markerModal) {
		return;
	}
	markerModal.classList.add('hidden');
	document.removeEventListener('keydown', handleModalKeydown);
	resetMarkerForm();
	exitMarkerFlow();
}

function handleModalKeydown(event) {
	if (event.key === 'Escape') {
		event.preventDefault();
		closeMarkerModal();
	}
}

function extractCoordinates(event) {
	const candidates = [event, event?.data];
	for (const candidate of candidates) {
		if (!candidate) {
			continue;
		}
		const ra = Number(candidate.ra ?? candidate.lon ?? candidate.lng ?? candidate.alpha);
		const dec = Number(candidate.dec ?? candidate.lat ?? candidate.beta);
		if (Number.isFinite(ra) && Number.isFinite(dec)) {
			return { ra, dec };
		}
	}
	return null;
}

function handleSkyClick(event) {
	if (markerMode !== 'armed') {
		return;
	}
	const coordinates = extractCoordinates(event);
	if (!coordinates) {
		return;
	}
	markerMode = 'pending';
	pendingMarkerPosition = coordinates;
	if (addMarkerButton) {
		addMarkerButton.classList.remove('marker-control--active');
		addMarkerButton.disabled = true;
	}
	openMarkerModal();
}

function startMarkerPlacement() {
	if (!aladinInstance) {
		return;
	}
	ensureMarkerLayer();
	markerMode = 'armed';
	if (addMarkerButton) {
		addMarkerButton.classList.add('marker-control--active');
		addMarkerButton.disabled = false;
	}
	setTemporaryStatus('Click on the sky map to choose where the new marker should be placed.');
}

function handleMarkerSubmission(event) {
	event.preventDefault();
	if (!pendingMarkerPosition || !markerLayer) {
		closeMarkerModal();
		return;
	}
	const title = markerTitleInput?.value.trim() || `Marker ${placedMarkers.length + 1}`;
	const description = markerDescriptionInput?.value.trim() || '';
	const color = markerColorInput?.value || '#60A5FA';
	const markerOptions = {
		popupTitle: title,
		popupDesc: description
	};
	try {
		const marker = A.marker(pendingMarkerPosition.ra, pendingMarkerPosition.dec, markerOptions);
		marker.useMarkerDefaultIcon = false;
		if (typeof marker.setImage === 'function') {
			marker.setImage(createMarkerIcon(color));
		}
		marker.color = color;
		markerLayer.addSources([marker]);
		placedMarkers.push(marker);
		updateRemoveMarkerState();
	} catch (error) {
		console.error('Unable to add marker', error);
		showError('We could not create the marker. Please try again.');
	}
	closeMarkerModal();
}

function removeLatestMarker() {
	if (!markerLayer || placedMarkers.length === 0) {
		return;
	}
	const marker = placedMarkers.pop();
	try {
		if (typeof markerLayer.remove === 'function') {
			markerLayer.remove(marker);
		} else if (typeof markerLayer.removeSources === 'function') {
			markerLayer.removeSources([marker]);
		} else if (typeof markerLayer.removeSource === 'function') {
			markerLayer.removeSource(marker);
		} else if (typeof markerLayer.removeAll === 'function') {
			markerLayer.removeAll();
			placedMarkers.length = 0;
		}
	} catch (error) {
		console.warn('Unable to remove marker individually, clearing all markers', error);
		if (typeof markerLayer.removeAll === 'function') {
			markerLayer.removeAll();
			placedMarkers.length = 0;
		}
	}
	updateRemoveMarkerState();
}

function loadFits(source, options = {}) {
	if (!aladinInstance || !source) {
		return;
	}

	const requestId = ++currentRequestId;
	const label = options.label || deriveLabel(source);

	clearError();
	statusMessage.textContent = `Loading ${label}…`;
	const loadTimeout = window.setTimeout(() => {
		if (requestId !== currentRequestId) {
			return;
		}
		console.warn(`FITS load timed out: ${label}`);
		showError('The FITS file is taking longer than expected to respond. Please try again or use a different source.');
	}, options.timeout ?? 20000);

	let finished = false;

	const finish = () => {
		if (finished) {
			return;
		}
		finished = true;
		window.clearTimeout(loadTimeout);
		if (typeof options.onCleanup === 'function') {
			try {
				options.onCleanup();
			} catch (cleanupError) {
				console.warn('Cleanup callback failed', cleanupError);
			}
		}
	};

	const handleSuccess = (ra, dec, fov, image) => {
		if (requestId !== currentRequestId) {
			return;
		}
		finish();
		configureImage(image, options.colormap);
		focusOnImage(ra, dec, fov);
		updateStatus(label, fov);
	};

	const handleError = (error) => {
		if (requestId !== currentRequestId) {
			return;
		}
		finish();
		console.error('Failed to load FITS data', error);
		showError('Unable to load the FITS data. Please verify the file or URL and try again.');
	};

	try {
		const result = aladinInstance.displayFITS(source, options.params || {}, handleSuccess, handleError);
		if (result && typeof result.then === 'function') {
			result.catch(handleError).finally(finish);
		}
	} catch (error) {
		handleError(error);
	}
}

function handleFileSelection(event) {
	const [file] = event.target.files || [];
	if (!file) {
		return;
	}
	const objectUrl = URL.createObjectURL(file);
	loadFits(objectUrl, {
		label: `Local file: ${file.name}`,
		onCleanup: () => URL.revokeObjectURL(objectUrl)
	});
	event.target.value = '';
}

function handleUrlLoad() {
	const url = urlInput.value.trim();
	if (!url) {
		showError('Please enter a FITS file URL.');
		return;
	}
	try {
		new URL(url);
	} catch {
		showError('The URL appears to be invalid. Please double-check and try again.');
		return;
	}
	loadFits(url, { label: url });
}

function initialiseSampleButtons() {
	sampleButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const { fitsUrl, label, colormap } = button.dataset;
			loadFits(fitsUrl, { label, colormap });
		});
	});
}

async function initialiseViewer() {
	if (!A) {
		showError('Aladin Lite could not be loaded. Please check your connection and refresh the page.');
		return;
	}
	try {
		A.init.then(() => {
			aladinInstance = A.aladin('#aladin-lite-div', {
				cooFrame: 'icrs',
				projection: 'AIT',
				showCooGrid: false,
				fullScreen: true,
				fov: 5,
				target: 'M 31'
			});

			ensureMarkerLayer();
			if (addMarkerButton) {
				addMarkerButton.disabled = false;
			}
			updateRemoveMarkerState();
			if (typeof aladinInstance.on === 'function') {
				aladinInstance.on('click', handleSkyClick);
			}
		});

		initialiseSampleButtons();
		if (DEFAULT_SAMPLE) {
			loadFits(DEFAULT_SAMPLE.url, DEFAULT_SAMPLE);
		} else {
			updateStatus(null);
		}
	} catch (error) {
		console.error('Aladin Lite failed to initialise', error);
		showError('The Aladin Lite viewer could not be initialised. Please refresh the page.');
	}
}

fileInput.addEventListener('change', handleFileSelection);
fileInput.addEventListener('click', () => {
	clearError();
});

loadUrlButton.addEventListener('click', handleUrlLoad);
urlInput.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') {
		event.preventDefault();
		handleUrlLoad();
	}
});

if (addMarkerButton) {
	addMarkerButton.addEventListener('click', () => {
		if (!aladinInstance) {
			showError('The FITS viewer is still initialising. Please wait a moment and try again.');
			return;
		}
		if (markerMode === 'armed') {
			exitMarkerFlow();
			return;
		}
		startMarkerPlacement();
	});
}

if (markerCancelButton) {
	markerCancelButton.addEventListener('click', (event) => {
		event.preventDefault();
		closeMarkerModal();
	});
}

if (markerForm) {
	markerForm.addEventListener('submit', handleMarkerSubmission);
}

if (removeMarkerButton) {
	removeMarkerButton.addEventListener('click', () => {
		removeLatestMarker();
	});
}

initialiseViewer();

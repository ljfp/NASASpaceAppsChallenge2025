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

let aladinInstance = null;
let currentRequestId = 0;

const DEFAULT_SAMPLE = sampleButtons.length
	? {
			url: sampleButtons[0].dataset.fitsUrl,
			label: sampleButtons[0].dataset.label,
			colormap: sampleButtons[0].dataset.colormap
	  }
	: null;

function showError(message) {
	errorBox.textContent = message;
	errorBox.classList.remove('hidden');
}

function clearError() {
	errorBox.textContent = '';
	errorBox.classList.add('hidden');
}

function updateStatus(label, fov) {
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

			var marker1 = A.marker(0, 0, {popupTitle: "Test", popupDesc: "TEST"});
			var markerLayer = A.catalog();
			aladinInstance.addCatalog(markerLayer);
			markerLayer.addSources([marker1]);
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

openComparisonButton = document.getElementById("open-comparison");
openComparisonButton.addEventListener('click', () => {
	console.log(aladinInstance.getBaseImageLayer());
});

initialiseViewer();

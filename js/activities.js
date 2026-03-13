// !!! IMPORTANT: REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL !!!
const API_URL = "https://script.google.com/macros/s/AKfycbwqpl2WC8LNNBSboEwTpsK5dyoJImzO5lpagKnM1YCGSahmIkS6Nta3qBtzWwU3KdxN/exec"; 

const activitiesContainer = document.getElementById('activities-container');

function createNoImagePlaceholder() {
    const noImage = document.createElement('div');
    noImage.style.backgroundColor = '#e0e0e0';
    noImage.style.height = '200px';
    noImage.style.display = 'flex';
    noImage.style.alignItems = 'center';
    noImage.style.justifyContent = 'center';
    noImage.style.color = '#777';
    noImage.style.fontSize = '0.9em';
    noImage.textContent = 'No image available';
    return noImage;
}

function extractDriveFileId(url) {
    if (!url) return null;

    const byPath = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if (byPath) return byPath[1];

    try {
        const parsed = new URL(url);
        const byQuery = parsed.searchParams.get('id');
        return byQuery || null;
    } catch (_) {
        return null;
    }
}

function buildImageCandidates(rawUrl) {
    if (!rawUrl) return [];

    const candidates = [rawUrl.trim()];
    const driveId = extractDriveFileId(rawUrl);

    if (driveId) {
        // Different Drive endpoints behave differently depending on sharing/referrer.
        candidates.push(`https://lh3.googleusercontent.com/d/${driveId}=w1600`);
        candidates.push(`https://drive.usercontent.google.com/uc?id=${driveId}`);
        candidates.push(`https://drive.google.com/uc?export=view&id=${driveId}`);
        candidates.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`);
    }

    return [...new Set(candidates)];
}

function createActivityImageFrame(rawUrl, altText) {
    const frame = document.createElement('div');
    frame.style.position = 'relative';
    frame.style.width = '100%';
    frame.style.minHeight = '140px';
    frame.style.backgroundColor = '#f5f5f5';
    frame.style.borderRadius = '8px';
    frame.style.overflow = 'hidden';

    const image = document.createElement('img');
    image.alt = altText;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.minHeight = '140px';
    image.style.objectFit = 'cover';
    image.style.display = 'block';

    const imageCandidates = buildImageCandidates(rawUrl);
    let candidateIndex = 0;

    const showUnavailableState = function() {
        frame.innerHTML = '';
        frame.style.display = 'flex';
        frame.style.alignItems = 'center';
        frame.style.justifyContent = 'center';
        frame.style.color = '#777';
        frame.style.fontSize = '0.85em';
        frame.textContent = 'Image unavailable';
    };

    const loadNextCandidate = function() {
        if (candidateIndex < imageCandidates.length) {
            image.src = imageCandidates[candidateIndex++];
            return;
        }
        showUnavailableState();
        console.warn('Failed to load image from all candidates:', rawUrl);
    };

    image.onerror = function() {
        loadNextCandidate();
    };

    frame.appendChild(image);

    if (imageCandidates.length === 0) {
        showUnavailableState();
    } else {
        loadNextCandidate();
    }

    return frame;
}

// Function to create and append an activity tile
function createActivityTile(activity) {
    const tile = document.createElement('div');
    tile.className = 'activity-tile';
    
    // --- Date Formatting ---
    const activityDate = new Date(activity.eventDate);
    const dateString = activityDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // --- Image Section ---
    if (Array.isArray(activity.imageUrls) && activity.imageUrls.length > 0) {
        const imageGallery = document.createElement('div');
        imageGallery.className = 'activity-image-gallery';
        imageGallery.style.display = 'grid';
        imageGallery.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
        imageGallery.style.gap = '8px';

        const validImageUrls = activity.imageUrls.filter(url => typeof url === 'string' && url.trim() !== '');

        if (validImageUrls.length > 0) {
            validImageUrls.forEach((rawUrl, index) => {
                const frame = createActivityImageFrame(
                    rawUrl,
                    `Photo ${index + 1} from ${activity.eventName} on ${dateString}`
                );
                imageGallery.appendChild(frame);
            });
            tile.appendChild(imageGallery);
        } else {
            tile.appendChild(createNoImagePlaceholder());
        }
    } else {
        // Fallback if no image URL is provided
        tile.appendChild(createNoImagePlaceholder());
    }

    // --- Content Section (Date, Name, Description) ---
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    const dateHeader = document.createElement('h3');
    dateHeader.textContent = dateString;
    contentDiv.appendChild(dateHeader);
    
    const nameParagraph = document.createElement('p');
    nameParagraph.innerHTML = `<strong>${activity.eventName}</strong>`; // Bold event name
    contentDiv.appendChild(nameParagraph);

    const description = document.createElement('p');
    description.textContent = activity.eventDescription || 'No description available.';
    contentDiv.appendChild(description);
    
    const locationHeader = document.createElement('h4');
    locationHeader.innerHTML = `Location: ${activity.eventLocation}`; // Bold event name
    contentDiv.appendChild(locationHeader);

    tile.appendChild(contentDiv); // Add the content div to the tile
    activitiesContainer.appendChild(tile);
}

// Function to fetch data from the Apps Script API
async function fetchActivities() {
    try {
        activitiesContainer.innerHTML = '<p class="loading">Loading our impactful activities...</p>'; 
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // --- Debugging: Log the received data ---
        console.log('API Response Data:', data); 

        // Clear the loading message
        activitiesContainer.innerHTML = ''; 

        if (data.activities && data.activities.length > 0) {
            const sortedActivities = [...data.activities].sort((a, b) => {
                // Latest date first (descending). Invalid dates go to the end.
                const dateA = new Date(a.eventDate).getTime();
                const dateB = new Date(b.eventDate).getTime();

                const safeDateA = Number.isNaN(dateA) ? -Infinity : dateA;
                const safeDateB = Number.isNaN(dateB) ? -Infinity : dateB;

                return safeDateB - safeDateA;
            });

            sortedActivities.forEach(activity => {
                createActivityTile(activity);
            });
        } else {
            activitiesContainer.innerHTML = '<p class="error-message">No daily activities found yet.</p>';
        }

    } catch (error) {
        console.error('Error fetching activities:', error);
        activitiesContainer.innerHTML = '<p class="error-message">🛑 Failed to load activities. Please check the API URL, network connection, and Google Apps Script deployment.</p>';
    }
}

// Run the fetch function when the page loads
fetchActivities();

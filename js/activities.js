// !!! IMPORTANT: REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL !!!
const API_URL = "https://script.google.com/macros/s/AKfycbwqpl2WC8LNNBSboEwTpsK5dyoJImzO5lpagKnM1YCGSahmIkS6Nta3qBtzWwU3KdxN/exec"; 

const activitiesContainer = document.getElementById('activities-container');

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
    if (activity.imageUrls && activity.imageUrls.length > 0) {
        // Use the first URL for the tile image
        const firstImageUrl = activity.imageUrls[0]; 
        
        const image = document.createElement('img');
        image.src = firstImageUrl;
        image.alt = `Photo from ${activity.eventName} on ${dateString}`;
        image.loading = 'lazy'; // Improve performance by lazy-loading images
        image.onerror = function() {
            // Hide the image if it fails to load
            image.style.display = 'none'; 
            console.warn('Failed to load image:', firstImageUrl);
        };
        tile.appendChild(image);
    } else {
        // Fallback if no image URL is provided
        const noImage = document.createElement('div');
        noImage.style.backgroundColor = '#e0e0e0';
        noImage.style.height = '200px';
        noImage.style.display = 'flex';
        noImage.style.alignItems = 'center';
        noImage.style.justifyContent = 'center';
        noImage.style.color = '#777';
        noImage.style.fontSize = '0.9em';
        noImage.textContent = 'No image available';
        tile.appendChild(noImage);
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
            data.activities.forEach(activity => {
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
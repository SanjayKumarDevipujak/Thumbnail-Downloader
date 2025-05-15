document.addEventListener('DOMContentLoaded', function() {
    const fetchBtn = document.getElementById('fetchBtn');
    const videoUrlInput = document.getElementById('videoUrl');
    const resultDiv = document.getElementById('result');
    const videoTitle = document.getElementById('videoTitle');
    const videoDesc = document.getElementById('videoDesc');
    const videoIdElement = document.getElementById('videoId');
    const thumbnailGrid = document.querySelector('.thumbnail-grid');
    
    // Copy buttons functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            const targetId = e.target.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            copyToClipboard(targetElement.textContent);
            e.target.textContent = 'Copied!';
            setTimeout(() => {
                e.target.textContent = targetId === 'videoTitle' ? 'Copy Title' : 
                                      targetId === 'videoId' ? 'Copy Video ID' : 'Copy Description';
            }, 2000);
        }
    });
    
    fetchBtn.addEventListener('click', fetchThumbnails);
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fetchThumbnails();
    });
    
    async function fetchThumbnails() {
        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;
        
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            alert('Please enter a valid YouTube URL');
            return;
        }
        
        videoIdElement.textContent = videoId;
        
        try {
            // Fetch video details from YouTube API
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=AIzaSyD37FUkvsMTxLxfT7pHrwtuizL_1q7jYtg`);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const snippet = data.items[0].snippet;
                videoTitle.textContent = snippet.title;
                videoDesc.textContent = snippet.description;
            } else {
                videoTitle.textContent = 'Video details not available';
                videoDesc.textContent = 'Could not fetch video description';
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
            videoTitle.textContent = 'Error fetching video details';
            videoDesc.textContent = 'Please check your connection and try again';
        }
        
        // Generate thumbnail URLs
        const thumbnails = [
            { quality: 'Max Resolution', url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
            { quality: 'High Quality', url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
            { quality: 'Medium Quality', url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
            { quality: 'Standard Quality', url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg` },
            { quality: 'Default', url: `https://img.youtube.com/vi/${videoId}/default.jpg` }
        ];
        
        // Display thumbnails
        thumbnailGrid.innerHTML = '';
        // Add this at the top with other DOM element selections
        const previewModal = document.createElement('div');
        previewModal.className = 'preview-modal';
        document.body.appendChild(previewModal);
        
        // Add download icon HTML
        const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>`;
        
        // Modify the thumbnail creation part in fetchThumbnails()
        thumbnails.forEach(thumb => {
            const thumbnailItem = document.createElement('div');
            thumbnailItem.className = 'thumbnail-item';
            
            const img = document.createElement('img');
            img.src = thumb.url;
            img.alt = `YouTube thumbnail (${thumb.quality})`;
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => showPreview(thumb.url));
            
            img.onerror = function() {
                // If thumbnail doesn't exist, remove the item
                if (thumb.quality !== 'Max Resolution') {
                    thumbnailItem.remove();
                }
            };
            
            const downloadBtn = document.createElement('a');
            downloadBtn.className = 'download-btn';
            downloadBtn.href = thumb.url;
            downloadBtn.download = `youtube-thumbnail-${videoId}-${thumb.quality.toLowerCase().replace(' ', '-')}.jpg`;
            downloadBtn.innerHTML = `${downloadIcon} Download ${thumb.quality}`;
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Trigger download immediately
                const link = document.createElement('a');
                link.href = thumb.url;
                link.download = downloadBtn.download;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Visual feedback
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = `${downloadIcon} Downloading...`;
                setTimeout(() => {
                    downloadBtn.innerHTML = `${downloadIcon} Downloaded!`;
                    setTimeout(() => {
                        downloadBtn.innerHTML = originalText;
                    }, 1000); // Shorter feedback duration
                }, 100); // Faster feedback
            });
            
            thumbnailItem.appendChild(img);
            thumbnailItem.appendChild(downloadBtn);
            thumbnailGrid.appendChild(thumbnailItem);
        });
        
        // Add these new functions at the bottom
        function showPreview(imageUrl) {
            previewModal.innerHTML = `
                <div class="preview-content">
                    <button class="close-preview">&times;</button>
                    <img src="${imageUrl}" alt="Preview">
                    <div class="preview-actions">
                        <a href="${imageUrl}" download="youtube-thumbnail.jpg" class="download-btn">
                            ${downloadIcon} Download Full Size
                        </a>
                    </div>
                </div>
            `;
            
            previewModal.classList.add('active');
            
            previewModal.querySelector('.close-preview').addEventListener('click', () => {
                previewModal.classList.remove('active');
            });
        }
        
        // Close preview when clicking outside
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                previewModal.classList.remove('active');
            }
        });
        
        resultDiv.classList.remove('hidden');
    }
    
    function extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
});
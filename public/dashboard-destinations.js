// Dashboard - Destination Management Functions

async function configureRTMP(channelNum) {
    const rtmpUrlInput = document.getElementById(`rtmp-url-${channelNum}`);
    const streamKeyInput = document.getElementById(`stream-key-${channelNum}`);
    const destNameInput = document.getElementById(`dest-name-${channelNum}`);

    const rtmpUrl = rtmpUrlInput.value.trim();
    const streamKey = streamKeyInput.value.trim();
    const name = destNameInput.value.trim() || 'RTMP-Output';

    if (!rtmpUrl || !streamKey) {
        alert('Please enter both RTMP URL and Stream Key');
        return;
    }

    try {
        const response = await fetch(`/api/channel/${channelNum}/destination/rtmp`, {
            method: 'POST',
            credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rtmpUrl, streamKey, name })
        });

        const result = await response.json();

        if (result.success) {
            alert(`RTMP destination configured for Channel ${channelNum}\n\nDestination: ${name}\nURL: ${rtmpUrl}\n\nYou can now start the channel!`);
            updateDestinationUI(channelNum, 'RTMP', name, rtmpUrl);
        } else {
            alert(`Error configuring RTMP destination:\n${result.error}`);
        }
    } catch (error) {
        console.error('Error configuring RTMP destination:', error);
        alert('Failed to configure RTMP destination');
    }
}

async function configureSRT(channelNum) {
    const srtUrlInput = document.getElementById(`srt-url-${channelNum}`);
    const streamIdInput = document.getElementById(`srt-stream-id-${channelNum}`);
    const destNameInput = document.getElementById(`dest-name-${channelNum}`);

    const srtUrl = srtUrlInput.value.trim();
    const streamId = streamIdInput.value.trim();
    const name = destNameInput.value.trim() || 'SRT-Output';

    if (!srtUrl || !streamId) {
        alert('Please enter both SRT URL and Stream ID');
        return;
    }

    try {
        const response = await fetch(`/api/channel/${channelNum}/destination/srt`, {
            method: 'POST',
            credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ srtUrl, streamId, name })
        });

        const result = await response.json();

        if (result.success) {
            alert(`SRT destination configured for Channel ${channelNum}\n\nDestination: ${name}\nURL: ${srtUrl}\n\nYou can now start the channel!`);
            updateDestinationUI(channelNum, 'SRT', name, srtUrl);
        } else {
            alert(`Error configuring SRT destination:\n${result.error}`);
        }
    } catch (error) {
        console.error('Error configuring SRT destination:', error);
        alert('Failed to configure SRT destination');
    }
}

async function removeDestination(channelNum) {
    if (!confirm('Remove configured destination? You will need to configure a new one before streaming.')) {
        return;
    }

    try {
        const response = await fetch(`/api/channel/${channelNum}/destination/remove`, {
            method: 'POST',
            credentials: 'include', headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            alert(`Destination removed for Channel ${channelNum}`);
            updateDestinationUI(channelNum, null);
        } else {
            alert(`Error removing destination:\n${result.error}`);
        }
    } catch (error) {
        console.error('Error removing destination:', error);
        alert('Failed to remove destination');
    }
}

function updateDestinationUI(channelNum, type, name, url) {
    const statusDiv = document.getElementById(`dest-status-${channelNum}`);
    if (!statusDiv) return;

    if (type) {
        statusDiv.innerHTML = `
            <div class="destination-configured">
                <span class="dest-indicator">✅ ${type} Configured</span>
                <div class="dest-details">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>URL:</strong> ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}</p>
                </div>
                <button class="btn btn-small btn-danger" onclick="removeDestination(${channelNum})">Remove</button>
            </div>
        `;
    } else {
        statusDiv.innerHTML = `
            <div class="destination-idle">
                <span class="dest-indicator-idle">⚪ No destination configured</span>
            </div>
        `;
    }
}

function toggleDestinationType(channelNum, type) {
    const rtmpForm = document.getElementById(`rtmp-form-${channelNum}`);
    const srtForm = document.getElementById(`srt-form-${channelNum}`);
    const rtmpTab = document.getElementById(`dest-tab-rtmp-${channelNum}`);
    const srtTab = document.getElementById(`dest-tab-srt-${channelNum}`);

    if (type === 'rtmp') {
        rtmpForm.style.display = 'block';
        srtForm.style.display = 'none';
        rtmpTab.classList.add('active');
        srtTab.classList.remove('active');
    } else {
        rtmpForm.style.display = 'none';
        srtForm.style.display = 'block';
        rtmpTab.classList.remove('active');
        srtTab.classList.add('active');
    }
}

function fillCASTR(channelNum) {
    document.getElementById(`srt-url-${channelNum}`).value = 'srt://au.castr.io:9998';
    document.getElementById(`srt-stream-id-${channelNum}`).value = '#!::r=live_81c06b509f1b11f0a5db8fcec287313a,password=b97f45f7,m=publish';
    document.getElementById(`dest-name-${channelNum}`).value = 'CASTR';
    toggleDestinationType(channelNum, 'srt');
}

function fillYouTube(channelNum) {
    document.getElementById(`rtmp-url-${channelNum}`).value = 'rtmp://a.rtmp.youtube.com/live2';
    document.getElementById(`stream-key-${channelNum}`).value = '';
    document.getElementById(`dest-name-${channelNum}`).value = 'YouTube';
    toggleDestinationType(channelNum, 'rtmp');
    document.getElementById(`stream-key-${channelNum}`).focus();
}

function fillFacebook(channelNum) {
    document.getElementById(`rtmp-url-${channelNum}`).value = 'rtmps://live-api-s.facebook.com:443/rtmp';
    document.getElementById(`stream-key-${channelNum}`).value = '';
    document.getElementById(`dest-name-${channelNum}`).value = 'Facebook';
    toggleDestinationType(channelNum, 'rtmp');
    document.getElementById(`stream-key-${channelNum}`).focus();
}

console.log('[Dashboard] Destination management functions loaded');

async function removeDestinationUI(channelNum) {
    if (!confirm('Remove all destinations from Channel ' + channelNum + '?\n\nChannel must be IDLE.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/channel/' + channelNum + '/destination', {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Destinations removed from Channel ' + channelNum);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error removing destination:', error);
        alert('Failed to remove destination');
    }
}

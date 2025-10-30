// Check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        if (!data.authenticated) {
            window.location.href = '/';
        }
    } catch (error) {
        window.location.href = '/';
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
});

// Initialize dashboard
async function initDashboard() {
    await checkAuth();
    createChannelCards();
    await refreshAllChannels();
    await refreshCosts();
    setInterval(refreshAllChannels, 30000);
    setInterval(refreshCosts, 30000);
}

// Create channel cards
function createChannelCards() {
    const grid = document.querySelector('.channels-grid');
    for (let i = 1; i <= 5; i++) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.id = `channel-${i}`;
        card.innerHTML = `
            <div class="channel-header">
                <h3>Channel ${i}</h3>
                <span class="channel-status" id="status-${i}">UNKNOWN</span>
            </div>
            <div class="channel-body">
                <div class="channel-info">
                    <p><strong>State:</strong> <span id="state-${i}">-</span></p>
                    <p><strong>Channel ID:</strong> <span id="id-${i}">Not configured</span></p>
                </div>

                <div class="channel-controls">
                    <button class="btn btn-success" onclick="startChannel(${i})" id="start-${i}">Start Channel</button>
                    <button class="btn btn-danger" onclick="stopChannel(${i})" id="stop-${i}">Stop Channel</button>
                </div>

                <div class="video-player-section">
                    <h4 style="margin: 10px 0; color: #60a5fa; font-size: 14px;">Program Output</h4>
                    <div class="video-player-container">
                        <iframe src="/player.html?channel=program${i}" allow="autoplay" style="width:100%; height:100%; border:none;"></iframe>
                    </div>
                </div>

                <div class="collapsible-section" style="margin-top: 15px; background: #1a1a2e; border-radius: 8px;">
                    <div onclick="toggleDestinations(${i})" style="padding: 12px 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
                        <h4 style="color: #e74c3c; margin: 0; font-size: 16px;">Stream Destination</h4>
                        <span id="dest-toggle-${i}" style="color: #e74c3c; font-size: 18px;">▶</span>
                    </div>

                    <div id="dest-content-${i}" style="padding: 0 15px; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease;">
                        <div style="padding: 15px 0;">
                            <p class="destination-help">⚠ Configure destination BEFORE starting channel. Channel must be IDLE to change.</p>

                            <div id="dest-status-${i}" class="destination-status">
                                <div class="destination-idle">
                                    <span class="dest-indicator-idle">⚪ No destination configured</span>
                                </div>
                            </div>

                            <div class="dest-type-tabs">
                                <button class="dest-tab active" id="dest-tab-rtmp-${i}" onclick="toggleDestinationType(${i}, 'rtmp')">
                                    RTMP (YouTube, Facebook)
                                </button>
                                <button class="dest-tab" id="dest-tab-srt-${i}" onclick="toggleDestinationType(${i}, 'srt')">
                                    SRT (CASTR)
                                </button>
                            </div>

                            <div class="dest-quick-fill">
                                <strong>Quick Fill:</strong>
                                <button class="btn btn-small" onclick="fillCASTR(${i})">CASTR SRT</button>
                                <button class="btn btn-small" onclick="fillYouTube(${i})">YouTube</button>
                                <button class="btn btn-small" onclick="fillFacebook(${i})">Facebook</button>
                            </div>

                            <div id="rtmp-form-${i}" class="dest-config-form">
                                <input type="text" id="rtmp-url-${i}" placeholder="RTMP URL (e.g., rtmp://a.rtmp.youtube.com/live2)" class="dest-input">
                                <input type="text" id="stream-key-${i}" placeholder="Stream Key" class="dest-input">
                                <input type="text" id="dest-name-${i}" placeholder="Destination Name" class="dest-input">
                                <button class="btn btn-small btn-primary" onclick="configureRTMP(${i})">Configure RTMP</button>
                            </div>

                            <div id="srt-form-${i}" class="dest-config-form" style="display: none;">
                                <input type="text" id="srt-url-${i}" placeholder="SRT URL (e.g., srt://au.castr.io:9998)" class="dest-input">
                                <textarea id="srt-stream-id-${i}" placeholder="Stream ID" class="dest-textarea" rows="3"></textarea>
                                <button class="btn btn-small btn-primary" onclick="configureSRT(${i})">Configure SRT</button>
                            </div>
                            <div style="margin-top: 10px;">
                                <button class="btn btn-small btn-danger" onclick="removeDestinationUI(${i})">Remove All Destinations</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="collapsible-section" style="margin-top: 15px; background: #1a1a2e; border-radius: 8px;">
                    <div onclick="toggleOverlay(${i})" style="padding: 12px 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
                        <h4 style="color: #e74c3c; margin: 0; font-size: 16px;">HTML5 Overlay (Live Switching)</h4>
                        <span id="overlay-toggle-${i}" style="color: #e74c3c; font-size: 18px;">▶</span>
                    </div>

                    <div id="overlay-content-${i}" style="padding: 0 15px; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease;">
                        <div style="padding: 15px 0;">
                            <p class="overlay-help">Change overlays instantly while channel is RUNNING - no restart needed!</p>
                            <input type="text" id="overlay-url-${i}" placeholder="https://ligr.live/overlay/..." class="overlay-input">
                            <div class="overlay-controls">
                                <button class="btn btn-small btn-success" onclick="enableOverlay(${i})">Activate Overlay</button>
                                <button class="btn btn-small btn-danger" onclick="disableOverlay(${i})">Remove Overlay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

// Start channel
async function startChannel(channelNum) {
    if (!confirm(`Start Channel ${channelNum}?\n\nThis will begin AWS MediaLive billing at ~$4/hour.`)) return;
    const btn = document.getElementById(`start-${channelNum}`);
    btn.disabled = true;
    btn.textContent = 'Starting...';
    try {
        const response = await fetch(`/api/channel/${channelNum}/start`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            alert(`Channel ${channelNum} is starting (1-2 minutes).`);
            pollChannelStatus(channelNum);
        } else {
            alert(`Failed: ${result.error}`);
            btn.disabled = false;
            btn.textContent = 'Start Channel';
        }
    } catch (error) {
        alert('Network error');
        btn.disabled = false;
        btn.textContent = 'Start Channel';
    }
}

// Stop channel
async function stopChannel(channelNum) {
    // Warning about active recordings
    if (!confirm(`⚠️ WARNING: Stopping Channel ${channelNum} will FINALIZE any active recording!\n\nThe current recording session will be saved to S3 as a .ts file.\n\nTo properly manage recordings, use the "Recordings & Downloads" page instead.\n\nContinue stopping the channel?`)) {
        return;
    }

    const btn = document.getElementById(`stop-${channelNum}`);
    btn.disabled = true;
    btn.textContent = 'Stopping...';
    try {
        const response = await fetch(`/api/channel/${channelNum}/stop`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            alert(`Channel ${channelNum} is stopping.\n\nYour recording will be finalized to S3 in ~30 seconds.\nCheck the Recordings page to see the file.`);
            pollChannelStatus(channelNum);
        } else {
            alert(`Failed: ${result.error}`);
            btn.disabled = false;
            btn.textContent = 'Stop Channel';
        }
    } catch (error) {
        alert('Network error');
        btn.disabled = false;
        btn.textContent = 'Stop Channel';
    }
}

// Enable overlay - dynamic activation on RUNNING channels
async function enableOverlay(channelNum) {
    const urlInput = document.getElementById(`overlay-url-${channelNum}`);
    const url = urlInput.value.trim();
    if (!url) {
        alert('Please enter an overlay URL');
        return;
    }
    try {
        const response = await fetch(`/api/channel/${channelNum}/overlay/activate`, {
            method: 'POST',
            credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const result = await response.json();
        if (result.success) {
            alert(`Overlay activated for Channel ${channelNum}\n\nOverlay will appear in 5-10 seconds.\nNo channel restart required!`);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        alert('Failed to activate overlay');
    }
}

// Disable overlay - dynamic deactivation on RUNNING channels
async function disableOverlay(channelNum) {
    try {
        const response = await fetch(`/api/channel/${channelNum}/overlay/deactivate`, {
            method: 'POST',
            credentials: 'include', headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            alert(`Overlay removed for Channel ${channelNum}\n\nOverlay will disappear in 5-10 seconds.\nNo channel restart required!`);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        alert('Failed to deactivate overlay');
    }
}

// Poll channel status
async function pollChannelStatus(channelNum) {
    const maxPolls = 60;
    let pollCount = 0;
    const interval = setInterval(async () => {
        await refreshChannelStatus(channelNum);
        const state = document.getElementById(`state-${channelNum}`).textContent;
        if (state === 'RUNNING' || state === 'IDLE' || pollCount++ >= maxPolls) {
            clearInterval(interval);
        }
    }, 5000);
}

// Refresh single channel status
async function refreshChannelStatus(channelNum) {
    try {
        const response = await fetch(`/api/channel/${channelNum}/status`);
        const status = await response.json();
        updateChannelUI(channelNum, status);
    } catch (error) {
        console.error(`Error refreshing channel ${channelNum}:`, error);
    }
}

// Refresh all channels
async function refreshAllChannels() {
    try {
        const response = await fetch('/api/channels/status');
        const data = await response.json();
        data.channels.forEach((status, index) => {
            updateChannelUI(index + 1, status);
        });
    } catch (error) {
        console.error('Error refreshing channels:', error);
    }
}

// Update channel UI
function updateChannelUI(channelNum, status) {
    const stateSpan = document.getElementById(`state-${channelNum}`);
    const statusBadge = document.getElementById(`status-${channelNum}`);
    const idSpan = document.getElementById(`id-${channelNum}`);
    const startBtn = document.getElementById(`start-${channelNum}`);
    const stopBtn = document.getElementById(`stop-${channelNum}`);

    if (status.success) {
        stateSpan.textContent = status.state;
        idSpan.textContent = status.channelId || 'Not configured';
        statusBadge.textContent = status.state;
        statusBadge.className = 'channel-status status-' + status.state.toLowerCase();

        if (status.state === 'RUNNING') {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.textContent = 'Start Channel';
            stopBtn.textContent = 'Stop Channel';
        } else if (status.state === 'IDLE') {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            startBtn.textContent = 'Start Channel';
            stopBtn.textContent = 'Stop Channel';
        } else {
            startBtn.disabled = true;
            stopBtn.disabled = true;
        }
    } else {
        stateSpan.textContent = status.state || 'ERROR';
        statusBadge.textContent = status.state || 'ERROR';
        statusBadge.className = 'channel-status status-error';
    }
}


// Refresh costs
async function refreshCosts() {
    try {
        const response = await fetch('/api/costs');
        const costs = await response.json();
        document.getElementById('runningChannels').textContent = costs.runningChannels;
        document.getElementById('costPerHour').textContent = `$${costs.costPerHour.toFixed(2)}`;
        document.getElementById('costPerDay').textContent = `$${costs.costPerDay.toFixed(2)}`;
        document.getElementById('costPerWeek').textContent = `$${costs.costPerWeek.toFixed(2)}`;
    } catch (error) {
        console.error('Error refreshing costs:', error);
    }
}

// Toggle collapsible sections
function toggleDestinations(channelNum) {
    const content = document.getElementById(`dest-content-${channelNum}`);
    const toggle = document.getElementById(`dest-toggle-${channelNum}`);

    if (content.style.maxHeight === '0px' || content.style.maxHeight === '') {
        content.style.maxHeight = '600px';
        content.style.padding = '0 15px';
        toggle.textContent = '▼';
    } else {
        content.style.maxHeight = '0px';
        content.style.padding = '0 15px';
        toggle.textContent = '▶';
    }
}

function toggleOverlay(channelNum) {
    const content = document.getElementById(`overlay-content-${channelNum}`);
    const toggle = document.getElementById(`overlay-toggle-${channelNum}`);

    if (content.style.maxHeight === '0px' || content.style.maxHeight === '') {
        content.style.maxHeight = '400px';
        content.style.padding = '0 15px';
        toggle.textContent = '▼';
    } else {
        content.style.maxHeight = '0px';
        content.style.padding = '0 15px';
        toggle.textContent = '▶';
    }
}

// Initialize on page load
window.addEventListener('load', initDashboard);

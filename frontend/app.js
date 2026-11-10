const API_BASE = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    updateNavbarUI();
    loadNetflixCards();
    setupModalsAndEvents();
});

// ১. ন্যাভবার কন্ট্রোল
function updateNavbarUI() {
    const navActions = document.getElementById('nav-actions');
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('username');

    if (token && username) {
        navActions.innerHTML = `
            <button class="btn btn-primary" id="open-write-modal-btn">✍️ Write Story</button>
            <div style="display: flex; align-items: center; gap: 10px; margin-left: 8px;">
                <span style="font-size: 0.85rem; color: #38bdf8; font-weight: 600;">@${username}</span>
                <button class="btn btn-danger" id="logout-btn">Logout</button>
            </div>
        `;

        document.getElementById('logout-btn').onclick = () => {
            localStorage.clear();
            location.reload();
        };

        document.getElementById('open-write-modal-btn').onclick = () => {
            document.getElementById('post-modal').style.display = 'flex';
        };

    } else {
        navActions.innerHTML = `
            <button class="btn btn-outline" id="open-auth-modal-btn">Sign In</button>
            <button class="btn btn-primary" id="open-register-btn">Get Started</button>
        `;

        document.getElementById('open-auth-modal-btn').onclick = () => openAuthModal(false);
        document.getElementById('open-register-btn').onclick = () => openAuthModal(true);
    }
}

// ২. হোমপেজে Netflix কার্ড গ্রিড লোড করা
async function loadNetflixCards() {
    const container = document.getElementById('posts-container');

    try {
        const res = await fetch(`${API_BASE}/posts/`);
        const posts = await res.json();

        if (posts.length === 0) {
            container.innerHTML = '<div style="color: #888; grid-column: 1/-1; text-align: center; padding: 3rem;">No technical stories published yet.</div>';
            return;
        }

        container.innerHTML = posts.map(post => {
            const date = new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
            });
            const fallbackImg = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80';

            return `
                <article class="netflix-card" data-post-id="${post.id}">
                    <div class="netflix-media">
                        <img src="${post.image || fallbackImg}" alt="${escapeHTML(post.title)}">
                    </div>
                    <h3 class="netflix-title">${escapeHTML(post.title)}</h3>
                    <div class="netflix-author">By ${escapeHTML(post.author_username)}</div>
                    <div class="netflix-meta">
                        <span class="n-logo">N</span>
                        <span>TechPulse Engineering Blog</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>
                </article>
            `;
        }).join('');

        // কার্ডে ক্লিক করলে সিঙ্গেল পোস্ট ভিউ ওপেন হবে
        document.querySelectorAll('.netflix-card').forEach(card => {
            card.onclick = () => {
                const postId = card.dataset.postId;
                openArticleDetail(postId);
            };
        });

    } catch (err) {
        container.innerHTML = '<div style="color: #ef4444; grid-column: 1/-1; text-align: center;">Unable to connect to backend API.</div>';
    }
}

// ৩. ক্লিক করলে আর্টিকেলের বিস্তারিত ভিউ ওপেন হওয়া (Reader Mode)
async function openArticleDetail(postId) {
    const homeView = document.getElementById('home-view');
    const articleView = document.getElementById('article-view');
    const detailContent = document.getElementById('article-detail-content');
    const currentUser = localStorage.getItem('username');
    const token = localStorage.getItem('auth_token');

    homeView.style.display = 'none';
    articleView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    detailContent.innerHTML = '<p style="color: #aaa;">Loading technical article...</p>';

    try {
        const res = await fetch(`${API_BASE}/posts/${postId}/`);
        const post = await res.json();

        const isOwner = (currentUser && currentUser === post.author_username);
        const date = new Date(post.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });

        detailContent.innerHTML = `
            <div class="detail-header">
                <h1>${escapeHTML(post.title)}</h1>
                <div class="detail-meta-bar">
                    <div>
                        Written by <strong style="color: #38bdf8;">@${post.author_username}</strong> on ${date}
                    </div>
                    ${isOwner ? `<button class="btn btn-danger" id="detail-delete-btn">Delete Story</button>` : ''}
                </div>
            </div>

            ${post.image ? `<img src="${post.image}" class="detail-cover-img" alt="Cover Diagram">` : ''}

            <div class="detail-body">${escapeHTML(post.content)}</div>

            <!-- কমেন্টস সেকশন -->
            <section class="discussion-section">
                <h3>💬 Discussion (${post.comments.length})</h3>
                <div id="comments-list">
                    ${post.comments.map(c => `
                        <div class="comment-card">
                            <div>
                                <strong style="color: #38bdf8;">@${c.author_username}:</strong> ${escapeHTML(c.text)}
                            </div>
                            ${currentUser && currentUser === c.author_username ? 
                                `<button class="btn btn-danger delete-comment-btn" data-id="${c.id}" style="padding: 2px 6px; font-size: 0.75rem;">Delete</button>` : ''}
                        </div>
                    `).join('')}
                </div>

                ${token ? `
                    <form class="comment-form" id="detail-comment-form">
                        <input type="text" id="comment-input" placeholder="Join the discussion..." required>
                        <button type="submit" class="btn btn-primary">Post Comment</button>
                    </form>
                ` : '<p style="font-size: 0.9rem; color: #888; margin-top: 1rem;">Sign in to join the technical discussion.</p>'}
            </section>
        `;

        // ডিলিট পোস্ট হ্যান্ডলার
        if (isOwner) {
            document.getElementById('detail-delete-btn').onclick = async () => {
                if (confirm('Permanently delete this story?')) {
                    const delRes = await fetch(`${API_BASE}/posts/${postId}/`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Token ${token}` }
                    });
                    if (delRes.ok) {
                        returnToHome();
                    } else {
                        alert('Delete failed.');
                    }
                }
            };
        }

        // কমেন্ট সাবমিট হ্যান্ডলার
        const commentForm = document.getElementById('detail-comment-form');
        if (commentForm) {
            commentForm.onsubmit = async (e) => {
                e.preventDefault();
                const text = document.getElementById('comment-input').value.trim();

                const cRes = await fetch(`${API_BASE}/posts/${postId}/comments/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({ text })
                });

                if (cRes.ok) {
                    openArticleDetail(postId); // কমেন্ট সহ রিফ্রেশ
                }
            };
        }

        // কমেন্ট ডিলিট
        document.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Delete this comment?')) {
                    await fetch(`${API_BASE}/comments/${btn.dataset.id}/`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Token ${token}` }
                    });
                    openArticleDetail(postId);
                }
            };
        });

    } catch (err) {
        detailContent.innerHTML = '<p style="color: #ef4444;">Failed to load article detail.</p>';
    }
}

// ৪. হোমপেজে ফিরে যাওয়া
function returnToHome() {
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('article-view').style.display = 'none';
    loadNetflixCards();
}

document.getElementById('back-to-home-btn').onclick = returnToHome;
document.getElementById('brand-home-btn').onclick = returnToHome;

// ৫. মোডাল হ্যান্ডলার্স
let isRegisterMode = false;

function openAuthModal(registerMode) {
    const authModal = document.getElementById('auth-modal');
    isRegisterMode = registerMode;
    document.getElementById('modal-title').innerText = register ? 'Join TechPulse' : 'Welcome Back';
    document.getElementById('modal-subtitle').innerText = register ? 'Create your account to publish articles.' : 'Sign in with your username and password.';
    document.getElementById('email-group').style.display = register ? 'block' : 'none';
    document.getElementById('auth-submit-btn').innerText = register ? 'Create Account' : 'Sign In';
    document.getElementById('auth-error').style.display = 'none';
    authModal.style.display = 'flex';
}

function setupModalsAndEvents() {
    const authModal = document.getElementById('auth-modal');
    const postModal = document.getElementById('post-modal');

    document.getElementById('auth-modal-close').onclick = () => authModal.style.display = 'none';
    document.getElementById('post-modal-close').onclick = () => postModal.style.display = 'none';
    document.getElementById('post-cancel-btn').onclick = () => postModal.style.display = 'none';

    document.getElementById('modal-toggle-btn').onclick = () => openAuthModal(!isRegisterMode);

    // অথেনটিকেশন ফর্ম
    document.getElementById('auth-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const email = document.getElementById('auth-email').value.trim();
        const errBanner = document.getElementById('auth-error');

        const endpoint = isRegisterMode ? `${API_BASE}/auth/register/` : `${API_BASE}/auth/login/`;
        const payload = isRegisterMode ? { username, email, password } : { username, password };

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('username', data.username);
            authModal.style.display = 'none';
            updateNavbarUI();
            loadNetflixCards();
        } else {
            errBanner.innerText = data.error || JSON.stringify(data);
            errBanner.style.display = 'block';
        }
    };

    // নতুন পোস্ট তৈরি
    document.getElementById('create-post-form').onsubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('auth_token');
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const imageFile = document.getElementById('post-image').files[0];

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (imageFile) formData.append('image', imageFile);

        const res = await fetch(`${API_BASE}/posts/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}` },
            body: formData
        });

        if (res.ok) {
            document.getElementById('create-post-form').reset();
            postModal.style.display = 'none';
            loadNetflixCards();
        } else {
            alert('Failed to publish.');
        }
    };
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
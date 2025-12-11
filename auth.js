// Shared Supabase Auth Configuration
let supabaseClient = null

// Wait for Supabase to load, then initialize
function initSupabase() {
    if (typeof supabase === 'undefined') {
        // Wait a bit and try again
        setTimeout(initSupabase, 100)
        return
    }
    
    const { createClient } = supabase
    supabaseClient = createClient('YOUR_URL', 'YOUR_ANON_KEY')
    
    // Now initialize auth
    initAuth()
}

// Auth state
let currentUser = null

// Initialize auth on page load
async function initAuth() {
    if (!supabaseClient) {
        setTimeout(initAuth, 100)
        return
    }
    // Check for auth callback (magic link)
    const { data: { session } } = await supabaseClient.auth.getSession()
    
    if (session) {
        currentUser = session.user
        updateHeaderForLoggedIn(session.user)
    } else {
        updateHeaderForLoggedOut()
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user
            updateHeaderForLoggedIn(session.user)
        } else if (event === 'SIGNED_OUT') {
            currentUser = null
            updateHeaderForLoggedOut()
        }
    })

    // Handle magic link callback
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('token_hash') && urlParams.get('type') === 'email') {
        // Magic link callback - Supabase will handle it automatically
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
    }
}

// Update header when user is logged in
function updateHeaderForLoggedIn(user) {
    const nav = document.querySelector('nav')
    if (!nav) return

    // Remove existing login/logout elements
    const existingLogin = nav.querySelector('.auth-login')
    const existingUserInfo = nav.querySelector('.auth-user-info')
    if (existingLogin) existingLogin.remove()
    if (existingUserInfo) existingUserInfo.remove()

    // Create user info container
    const userInfo = document.createElement('div')
    userInfo.className = 'auth-user-info'
    userInfo.style.cssText = 'display: flex; align-items: center; gap: 1rem; margin-left: auto;'

    // User greeting
    const greeting = document.createElement('span')
    greeting.textContent = `Hi, ${user.email}`
    greeting.style.cssText = 'color: #0a2540; font-weight: 500;'

    // Logout button
    const logoutBtn = document.createElement('button')
    logoutBtn.textContent = 'Logout'
    logoutBtn.className = 'logout-btn'
    logoutBtn.style.cssText = 'background: #ff6b35; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.2s;'
    logoutBtn.addEventListener('click', handleLogout)

    userInfo.appendChild(greeting)
    userInfo.appendChild(logoutBtn)
    nav.appendChild(userInfo)
}

// Update header when user is logged out
function updateHeaderForLoggedOut() {
    const nav = document.querySelector('nav')
    if (!nav) return

    // Remove existing login/logout elements
    const existingLogin = nav.querySelector('.auth-login')
    const existingUserInfo = nav.querySelector('.auth-user-info')
    if (existingLogin) existingLogin.remove()
    if (existingUserInfo) existingUserInfo.remove()

    // Create login button
    const loginBtn = document.createElement('a')
    loginBtn.href = '#'
    loginBtn.className = 'login auth-login'
    loginBtn.textContent = 'Login'
    loginBtn.style.cssText = 'background: #ff6b35; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 600; transition: background 0.2s;'
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault()
        showLoginModal()
    })

    nav.appendChild(loginBtn)
}

// Show login modal with email input
function showLoginModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('login-modal')
    if (existingModal) existingModal.remove()

    // Create modal overlay
    const modal = document.createElement('div')
    modal.id = 'login-modal'
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;'

    // Create modal content
    const modalContent = document.createElement('div')
    modalContent.style.cssText = 'background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);'

    const title = document.createElement('h2')
    title.textContent = 'Login'
    title.style.cssText = 'margin: 0 0 1rem 0; color: #0a2540;'

    const description = document.createElement('p')
    description.textContent = 'Enter your email to receive a magic link'
    description.style.cssText = 'margin: 0 0 1.5rem 0; color: #666;'

    const emailInput = document.createElement('input')
    emailInput.type = 'email'
    emailInput.placeholder = 'your@email.com'
    emailInput.style.cssText = 'width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 1rem; margin-bottom: 1rem; box-sizing: border-box;'
    emailInput.required = true

    const buttonContainer = document.createElement('div')
    buttonContainer.style.cssText = 'display: flex; gap: 1rem;'

    const sendBtn = document.createElement('button')
    sendBtn.textContent = 'Send Magic Link'
    sendBtn.style.cssText = 'flex: 1; background: #ff6b35; color: white; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;'
    
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.style.cssText = 'flex: 1; background: #e0e0e0; color: #333; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;'

    const messageDiv = document.createElement('div')
    messageDiv.id = 'login-message'
    messageDiv.style.cssText = 'margin-top: 1rem; padding: 0.75rem; border-radius: 6px; display: none;'

    // Send magic link
    sendBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim()
        if (!email) {
            showMessage(messageDiv, 'Please enter your email', 'error')
            return
        }

        sendBtn.disabled = true
        sendBtn.textContent = 'Sending...'

        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        })

        if (error) {
            showMessage(messageDiv, error.message, 'error')
            sendBtn.disabled = false
            sendBtn.textContent = 'Send Magic Link'
        } else {
            showMessage(messageDiv, 'Check your email for the magic link!', 'success')
            emailInput.disabled = true
            setTimeout(() => {
                modal.remove()
            }, 3000)
        }
    })

    // Close modal
    cancelBtn.addEventListener('click', () => {
        modal.remove()
    })

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove()
        }
    })

    buttonContainer.appendChild(sendBtn)
    buttonContainer.appendChild(cancelBtn)

    modalContent.appendChild(title)
    modalContent.appendChild(description)
    modalContent.appendChild(emailInput)
    modalContent.appendChild(buttonContainer)
    modalContent.appendChild(messageDiv)

    modal.appendChild(modalContent)
    document.body.appendChild(modal)

    // Focus email input
    emailInput.focus()
}

// Show message in modal
function showMessage(element, message, type) {
    element.textContent = message
    element.style.display = 'block'
    element.style.background = type === 'error' ? '#fee' : '#efe'
    element.style.color = type === 'error' ? '#c33' : '#3c3'
}

// Handle logout
async function handleLogout() {
    await supabaseClient.auth.signOut()
    currentUser = null
    updateHeaderForLoggedOut()
    // Redirect to home if on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html'
    }
}

// Get current user (for use in other scripts)
function getCurrentUser() {
    return currentUser
}

// Get Supabase client (for use in other scripts)
function getSupabaseClient() {
    return supabaseClient
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase)
} else {
    initSupabase()
}


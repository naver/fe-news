// Toasts a default alert
function toastAlert() {
    var alertContent = "This is a default alert with <a href='#' class='alert-link'>a link</a> being toasted.";
    // Built-in function
    halfmoon.initStickyAlert({
        content: alertContent,
        title: "Toast!"
    })
}

// Toggles the parent's dark mode (if this page is loaded in an iFrame) 
function parentToggleDarkmode() {
    window.parent.toggleDarkModeFromChild();
}

// Override the dark mode toggle function to call the parent's one
// Again, this is for the case where the page is loaded in an iFrame
if (window !== window.parent) {
    halfmoon.toggleDarkMode = parentToggleDarkmode;
}

// Toggle sidebar
function toggleSidebar() {
    halfmoon.toggleSidebar();
    
    requestIdleCallback(() => {
        bb.instance.forEach(inst => inst.resize());
    });
}

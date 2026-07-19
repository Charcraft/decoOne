document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", (e) => {
            if (link.hostname === window.location.hostname) {
                e.preventDefault();
                const url = link.href;
                document.body.classList.add("fade-out");
                setTimeout(() => {
                    window.location.href = url;
                }, 500);
            }
        });
    });
});
(() => {
    const hideLinks = (predicate) => {
        document.querySelectorAll('header nav a').forEach((link) => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            const label = link.textContent.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            if (predicate(href, label)) {
                link.closest('li')?.setAttribute('hidden', '');
            }
        });
    };

    hideLinks((href, label) =>
        href.includes('06.admin/') || label === 'admin' || label === 'manage site'
    );

    fetch('../11.Backend/api.php?action=session', { credentials: 'same-origin' })
        .then(async (response) => {
            if (response.status === 401) {
                if (window.location.pathname.toLowerCase().endsWith('/uploadmaterials.html')) {
                    window.location.replace(
                        '../02.Login-Register/login.html?next=upload&login_required=1'
                    );
                    return null;
                }
                hideLinks((href, label) =>
                    href.includes('06.admin/') ||
                    href.includes('03.studentdashboard/dashboard.html') ||
                    ['admin', 'manage site', 'student dashboard', 'dashboard', 'log out'].includes(label)
                );
                return null;
            }
            if (!response.ok) {
                throw new Error('Could not verify the current account.');
            }
            return response.json();
        })
        .then((session) => {
            if (!session) {
                return;
            }

            hideLinks((href, label) =>
                href.includes('02.login-register/login.html') ||
                label === 'login register'
            );

            document.querySelectorAll('header nav ul').forEach((list) => {
                if (list.querySelector('a[href*="logout.php"]')) {
                    return;
                }
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.href = '../11.Backend/logout.php';
                link.textContent = 'Log out';
                item.append(link);
                list.append(item);
            });

            if (session.role === 'student') {
                hideLinks((href, label) =>
                    href.includes('06.admin/') || ['admin', 'manage site'].includes(label)
                );
                document.querySelectorAll('header nav a').forEach((link) => {
                    const href = (link.getAttribute('href') || '').toLowerCase();
                    const label = link.textContent.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                    if (href.includes('03.studentdashboard/dashboard.html') || label === 'student dashboard') {
                        link.textContent = 'Dashboard';
                    }
                });
            } else if (session.role === 'admin') {
                hideLinks((href, label) =>
                    href.includes('03.studentdashboard/dashboard.html') ||
                    ['student dashboard', 'dashboard'].includes(label)
                );
                document.querySelectorAll('header nav a').forEach((link) => {
                    const href = (link.getAttribute('href') || '').toLowerCase();
                    const label = link.textContent.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                    if (href.includes('06.admin/admin.html') || label === 'admin') {
                        link.textContent = 'Manage Site';
                        link.closest('li')?.removeAttribute('hidden');
                    }
                });
            }
        })
        .catch((error) => {
            console.error('ShareStudy navigation could not be personalized:', error);
        });
})();

(() => {
    const header = document.querySelector('.home-page .site-header');
    const menuToggle = document.querySelector('.home-menu-toggle');
    const navigation = document.querySelector('#home-navigation');
    const recentMaterials = document.querySelector('#home-recent-materials');
    let browsingAuthorized = false;

    const loginForBrowse =
        '../02.Login-Register/login.html?next=browse&browse_required=1';
    const browseMaterials = '../04.BrowseMaterials/browsematerials.html';
    const setBrowseLinks = (authorized) => {
        document.querySelectorAll('[data-browse-link]').forEach((link) => {
            link.href = authorized ? browseMaterials : loginForBrowse;
        });
        document.querySelectorAll('[data-material-link]').forEach((link) => {
            link.href = authorized
                ? `../04.BrowseMaterials/materialdetails.html?id=${encodeURIComponent(link.dataset.materialId)}`
                : loginForBrowse;
        });
    };
    setBrowseLinks(false);

    if (!header || !menuToggle || !navigation) {
        return;
    }

    const setMenuOpen = (isOpen) => {
        header.dataset.menuOpen = String(isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute(
            'aria-label',
            isOpen ? 'Close navigation menu' : 'Open navigation menu'
        );
    };

    menuToggle.addEventListener('click', () => {
        setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    navigation.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            setMenuOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setMenuOpen(false);
        }
    });

    const setVisible = (selector, visible) => {
        const element = document.querySelector(selector);
        if (element) {
            element.hidden = !visible;
        }
    };

    const configureNavigation = async () => {
        try {
            const response = await fetch('../11.Backend/api.php?action=session', {
                credentials: 'same-origin'
            });

            if (response.status === 401) {
                return;
            }
            if (!response.ok) {
                throw new Error('Could not verify the current ShareStudy session.');
            }

            const session = await response.json();
            browsingAuthorized = true;
            setBrowseLinks(true);
            if (session.role === 'student') {
                setVisible('[data-navbar-dashboard]', true);
                setVisible('[data-navbar-login]', false);
                setVisible('[data-navbar-logout]', true);
                document.querySelectorAll('[data-upload-link]').forEach((link) => {
                    link.href = '../03.StudentDashboard/uploadmaterials.html';
                });

                const accountLink = document.querySelector('[data-account-link]');
                if (accountLink) {
                    accountLink.href = '../03.StudentDashboard/dashboard.html';
                    accountLink.textContent = 'Go to your dashboard';
                }
            } else if (session.role === 'admin') {
                setVisible('[data-navbar-admin]', true);
                setVisible('[data-navbar-login]', false);
                setVisible('[data-navbar-logout]', true);
                const accountLink = document.querySelector('[data-account-link]');
                if (accountLink) {
                    accountLink.href = '../06.Admin/admin.html';
                    accountLink.textContent = 'Go to your admin dashboard';
                }
                document.querySelectorAll('[data-upload-link]').forEach((link) => {
                    link.hidden = true;
                });
                setVisible('[data-upload-card]', false);
            }
        } catch (error) {
            console.error('ShareStudy navigation could not be personalized:', error);
        }
    };

    const createMaterialCard = (material) => {
        const card = document.createElement('article');
        card.className = 'material-card';

        const title = document.createElement('h3');
        title.textContent = material.title;

        const course = document.createElement('p');
        course.textContent = `Course: ${material.course || 'Not specified'}`;

        const subject = document.createElement('p');
        subject.textContent = `Subject: ${material.subject || 'Not specified'}`;

        const link = document.createElement('a');
        link.href = browsingAuthorized
            ? `../04.BrowseMaterials/materialdetails.html?id=${encodeURIComponent(material.id)}`
            : loginForBrowse;
        link.dataset.materialLink = '';
        link.dataset.materialId = material.id;
        link.textContent = 'View material';

        card.append(title, course, subject, link);
        return card;
    };

    const loadRecentMaterials = async () => {
        if (!recentMaterials) {
            return;
        }

        try {
            const response = await fetch('../11.Backend/api.php?action=recent_materials', {
                credentials: 'same-origin'
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Could not load recent materials.');
            }

            recentMaterials.replaceChildren();
            const materials = (result.materials || []).slice(0, 3);
            if (!materials.length) {
                const emptyState = document.createElement('p');
                emptyState.textContent = 'No approved materials are available yet. Check back soon or share the first one.';
                recentMaterials.append(emptyState);
                return;
            }

            materials.forEach((material) => {
                recentMaterials.append(createMaterialCard(material));
            });
        } catch (error) {
            recentMaterials.textContent = 'Recently shared materials could not be loaded. You can still browse all materials.';
            recentMaterials.setAttribute('role', 'status');
            console.error('ShareStudy recent materials could not be loaded:', error);
        }
    };

    configureNavigation();
    loadRecentMaterials();
})();

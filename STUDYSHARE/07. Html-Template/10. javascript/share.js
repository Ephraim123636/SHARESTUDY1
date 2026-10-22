
(() => {
    const databaseName = 'sharestudy';
    const materialsStoreName = 'materials';
    const downloadsKey = 'sharestudyDownloads';
    const ratingsKey = 'sharestudyRatings';
    const reportsKey = 'sharestudyReports';

    let databasePromise;

    // =========================
    // DATABASE: STUDY MATERIALS
    // =========================

    const openDatabase = () => {
        if (!('indexedDB' in window)) {
            return Promise.reject(
                new Error('Your browser does not support local material storage.')
            );
        }

        if (!databasePromise) {
            databasePromise = new Promise((resolve, reject) => {
                const request = window.indexedDB.open(databaseName, 1);

                request.onupgradeneeded = () => {
                    request.result.createObjectStore(
                        materialsStoreName,
                        { keyPath: 'id' }
                    );
                };

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        return databasePromise;
    };

    const getMaterials = async () => {
        const database = await openDatabase();

        return new Promise((resolve, reject) => {
            const request = database
                .transaction(materialsStoreName)
                .objectStore(materialsStoreName)
                .getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const getMaterial = async (id) => {
        const database = await openDatabase();

        return new Promise((resolve, reject) => {
            const request = database
                .transaction(materialsStoreName)
                .objectStore(materialsStoreName)
                .get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const saveMaterial = async (material) => {
        const database = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                materialsStoreName,
                'readwrite'
            );

            transaction.objectStore(materialsStoreName).put(material);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    };

    const readStoredList = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
            return [];
        }
    };

    const writeStoredList = (key, values) => {
        try {
            localStorage.setItem(key, JSON.stringify(values));
            return true;
        } catch {
            return false;
        }
    };

    // =========================
    // FORM MESSAGES
    // =========================

    const setFormStatus = (form, message, isError = false) => {
        let status = form.querySelector('[data-form-status]');

        if (!status) {
            status = document.createElement('p');
            status.dataset.formStatus = '';
            status.setAttribute('role', 'status');
            form.append(status);
        }

        status.textContent = message;
        status.setAttribute('role', isError ? 'alert' : 'status');
    };

    const normalizeText = (value) =>
        value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    const createMaterialCard = (material, includeStatus = false) => {
        const article = document.createElement('article');
        const title = document.createElement('h3');

        title.textContent = material.title;
        article.append(title);

        [
            `Course: ${material.course}`,
            `Year: ${material.year}`,
            `Subject: ${material.subject}`,
            `Material Type: ${material.type}`
        ].forEach((text) => {
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            article.append(paragraph);
        });

        if (includeStatus) {
            const status = document.createElement('p');
            status.textContent = `Status: ${material.status}`;
            article.append(status);
        }

        return article;
    };

    const initializeSessionNavigation = async () => {
        const navs = document.querySelectorAll('header nav');
        if (!navs.length) {
            return;
        }

        document.querySelectorAll('header nav a').forEach((link) => {
            const path = (link.getAttribute('href') || '').toLowerCase();
            const label = normalizeText(link.textContent);
            if (path.includes('06.admin/') || label === 'admin' || label === 'manage site') {
                link.closest('li')?.setAttribute('hidden', '');
            }
        });

        try {
            const response = await fetch('../11.Backend/api.php?action=session', {
                credentials: 'same-origin'
            });
            if (response.status === 401) {
                document.querySelectorAll('header nav a').forEach((link) => {
                    const path = (link.getAttribute('href') || '').toLowerCase();
                    const label = normalizeText(link.textContent);
                    if (
                        path.includes('06.admin/') ||
                        path.includes('03.studentdashboard/dashboard.html') ||
                        label === 'admin' ||
                        label === 'student dashboard' ||
                        label === 'manage site' ||
                        label === 'dashboard' ||
                        label === 'log out'
                    ) {
                        link.closest('li')?.setAttribute('hidden', '');
                    }
                });
                return;
            }
            if (!response.ok) {
                throw new Error('Could not verify the current account.');
            }

            const { role } = await response.json();
            document.querySelectorAll('header nav a').forEach((link) => {
                const path = (link.getAttribute('href') || '').toLowerCase();
                const label = normalizeText(link.textContent);
                const item = link.closest('li');

                if (
                    path.includes('02.login-register/login.html') ||
                    label === 'login register'
                ) {
                    item?.setAttribute('hidden', '');
                }

                if (role === 'student') {
                    if (path.includes('06.admin/') || label === 'admin' || label === 'manage site') {
                        item?.setAttribute('hidden', '');
                    }
                    if (path.includes('03.studentdashboard/dashboard.html') || label === 'student dashboard') {
                        link.textContent = 'Dashboard';
                        item?.removeAttribute('hidden');
                    }
                } else if (role === 'admin') {
                    if (path.includes('03.studentdashboard/dashboard.html') || label === 'student dashboard' || label === 'dashboard') {
                        item?.setAttribute('hidden', '');
                    }
                    if (path.includes('06.admin/admin.html') || label === 'admin' || label === 'manage site') {
                        link.textContent = 'Manage Site';
                        item?.removeAttribute('hidden');
                    }
                }
            });

            navs.forEach((nav) => {
                const list = nav.querySelector('ul');
                if (
                    !list ||
                    list.querySelector('[data-session-logout], a[href*="logout.php"]')
                ) {
                    return;
                }
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.href = '../11.Backend/logout.php';
                link.textContent = 'Log out';
                link.dataset.sessionLogout = '';
                item.append(link);
                list.append(item);
            });
        } catch (error) {
            console.error('ShareStudy navigation could not be personalized:', error);
        }
    };

    // =========================
    // STUDENT / ADMIN SELECTION
    // =========================

    const initializeLoginAccountType = () => {
        const accountTypeButtons =
            document.querySelectorAll('[data-account-type]');

        const emailInput = document.querySelector('#email');
        const accountTypeInput = document.querySelector('#account-type');
        const emailLabel = document.querySelector('#email-label');
        const loginSubtitle = document.querySelector('.login-subtitle');
        const loginButton = document.querySelector('#login-button');
        const registerLink = document.querySelector('#register-link');

        if (
            !accountTypeButtons.length ||
            !emailInput ||
            !accountTypeInput ||
            !emailLabel ||
            !loginSubtitle ||
            !loginButton ||
            !registerLink
        ) {
            return;
        }

        accountTypeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const isAdmin = button.dataset.accountType === 'admin';

                accountTypeButtons.forEach((accountButton) => {
                    const isSelected = accountButton === button;

                    accountButton.classList.toggle('active', isSelected);
                    accountButton.setAttribute(
                        'aria-pressed',
                        String(isSelected)
                    );
                });

                emailLabel.textContent = isAdmin
                    ? 'Admin Email'
                    : 'Email Address';

                emailInput.name = 'email';
                accountTypeInput.value = isAdmin ? 'admin' : 'student';

                emailInput.placeholder = isAdmin
                    ? 'Enter admin email'
                    : 'Email Address';

                loginSubtitle.textContent = isAdmin
                    ? 'Administrator Login'
                    : 'Log into your account';

                loginButton.textContent = isAdmin
                    ? 'Login as Admin'
                    : 'Log in as Student';

                registerLink.hidden = isAdmin;
            });
        });
    };

    // =========================
    // LOGIN FORM STATUS
    // =========================

    const initializeLoginForm = () => {
        const query = new URLSearchParams(window.location.search);
        const status = document.querySelector('#login-status');
        const form = status?.closest('form');

        const currentSessionRole = sessionStorage.getItem('studyshare_role') || localStorage.getItem('studyshare_role');
        if (currentSessionRole === 'student' && window.location.pathname.toLowerCase().endsWith('/login.html')) {
            window.location.replace('../03.StudentDashboard/dashboard.html');
            return;
        }
        if (currentSessionRole === 'admin' && window.location.pathname.toLowerCase().endsWith('/login.html')) {
            window.location.replace('../06.Admin/admin.html');
            return;
        }

        if (form && ['upload', 'browse'].includes(query.get('next'))) {
            const next = document.createElement('input');
            next.type = 'hidden';
            next.name = 'next';
            next.value = query.get('next');
            form.append(next);
        }

        if (!status) {
            return;
        }

        const messages = {
            registered: 'Registration successful. You can now log in.',
            logged_out: 'You have been logged out.',
            password_reset: 'Your password has been reset. You can now log in.',
            login_required: 'Please log in or register before uploading a material.',
            browse_required: 'Please log in or register before browsing study materials.',
            access_denied: 'Please log in with an administrator account to access that page.',
            invalid: 'Enter a valid email address and password.',
            credentials: 'The email, password, or selected account type is incorrect.',
            server: 'The login service could not connect. Please try again later.'
        };
        const messageKey = Object.keys(messages).find((key) => query.get(key) === '1' || query.get('login_error') === key);

        if (messageKey) {
            status.textContent = messages[messageKey];
            status.setAttribute('role', ['invalid', 'credentials', 'server', 'access_denied'].includes(messageKey) ? 'alert' : 'status');
        }
    };

    // =========================
    // PASSWORD CONFIRMATION
    // =========================

    const initializePasswordMatch = () => {
        const passwordInput = document.querySelector('#password');
        const confirmPasswordInput =
            document.querySelector('#confirm-password');

        if (!passwordInput || !confirmPasswordInput) {
            return;
        }

        const validatePasswordMatch = () => {
            confirmPasswordInput.setCustomValidity(
                confirmPasswordInput.value &&
                confirmPasswordInput.value !== passwordInput.value
                    ? 'Passwords do not match.'
                    : ''
            );
        };

        passwordInput.addEventListener('input', validatePasswordMatch);
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    };

    // =========================
    // MATERIAL UPLOAD
    // =========================

    // =========================
    // STUDENT: MY UPLOADS
    // =========================

    const initializeMyUploads = async () => {
        const section = Array.from(
            document.querySelectorAll('main section')
        ).find((item) =>
            item.querySelector('h2')?.textContent.includes(
                'My Uploaded Materials'
            )
        );

        if (!section) {
            return;
        }

        const materials = await getMaterials();

        section.querySelectorAll('article').forEach((article) =>
            article.remove()
        );

        if (!materials.length) {
            const emptyState = document.createElement('p');
            emptyState.textContent =
                'You have not uploaded any materials yet.';

            section.append(emptyState);
            return;
        }

        materials.sort((first, second) =>
            second.uploadedAt.localeCompare(first.uploadedAt)
        );

        materials.forEach((material) =>
            section.append(createMaterialCard(material, true))
        );
    };

    // =========================
    // ADMIN: APPROVE OR REJECT
    // =========================

    const initializeAdminMaterials = async () => {
        const path = window.location.pathname.toLowerCase();

        const statusByPage = path.endsWith('pendinguploads.html')
            ? 'Pending Approval'
            : path.endsWith('approvedmaterials.html')
                ? 'Approved'
                : path.endsWith('rejectedmaterials.html')
                    ? 'Rejected'
                    : null;

        if (!statusByPage) {
            return;
        }

        const section = document.querySelector('main section');
        const existingArticle = section?.querySelector('article');

        if (!section || !existingArticle) {
            return;
        }

        const materials = (await getMaterials()).filter(
            (material) => material.status === statusByPage
        );

        const list = document.createElement('div');

        const emptyMessage = Array.from(
            existingArticle.querySelectorAll('p')
        ).find((paragraph) =>
            paragraph.textContent.toLowerCase().includes('no ')
        );

        if (emptyMessage) {
            emptyMessage.hidden = materials.length > 0;
        }

        materials.forEach((material) => {
            const card = createMaterialCard(material, true);

            if (statusByPage === 'Pending Approval') {
                ['Approve', 'Reject'].forEach((label) => {
                    const button = document.createElement('button');

                    button.type = 'button';
                    button.textContent = label;

                    button.addEventListener('click', async () => {
                        material.status = label === 'Approve'
                            ? 'Approved'
                            : 'Rejected';

                        await saveMaterial(material);
                        window.location.reload();
                    });

                    card.append(button);
                });
            }

            list.append(card);
        });

        const oldList = section.querySelector('[data-material-list]');
        oldList?.remove();

        list.dataset.materialList = '';
        section.append(list);
    };

    // =========================
    // SEARCH APPROVED MATERIALS
    // =========================

    const initializeSearch = async () => {
        const searchInput = document.querySelector('#search');
        const filters = document.querySelector('#course')?.form;

        const resultsSection = Array.from(
            document.querySelectorAll('main section')
        ).find((section) =>
            section.querySelector('h2')?.textContent.includes(
                'Search Results'
            )
        );

        if (!searchInput || !filters || !resultsSection) {
            return;
        }

        const uploadedMaterials = (await getMaterials()).filter(
            (material) => material.status === 'Approved'
        );

        uploadedMaterials.forEach((material) => {
            const article = createMaterialCard(material);

            article.dataset.uploadedMaterial = material.id;

            const link = document.createElement('a');
            link.href =
                `materialdetails.html?id=${encodeURIComponent(material.id)}`;

            link.textContent = 'View Material';
            article.append(link);
            resultsSection.append(article);
        });

        const applyFilters = () => {
            const query = normalizeText(searchInput.value);

            const selectedFilters = Array.from(
                filters.querySelectorAll('select')
            ).map((select) =>
                select.value
                    ? normalizeText(
                        select.selectedOptions[0]?.textContent || ''
                    )
                    : ''
            );

            const articles = Array.from(
                resultsSection.querySelectorAll('article')
            );

            let visibleCount = 0;

            articles.forEach((article) => {
                const text = normalizeText(article.textContent);

                const matchesQuery =
                    !query || text.includes(query);

                const matchesFilters = selectedFilters.every(
                    (filter) => !filter || text.includes(filter)
                );

                article.hidden = !(matchesQuery && matchesFilters);

                if (!article.hidden) {
                    visibleCount += 1;
                }
            });

            let status = resultsSection.querySelector(
                '[data-search-status]'
            );

            if (!status) {
                status = document.createElement('p');
                status.dataset.searchStatus = '';
                status.setAttribute('role', 'status');
                resultsSection.append(status);
            }

            status.textContent = visibleCount
                ? `${visibleCount} material${visibleCount === 1 ? '' : 's'} found.`
                : 'No materials match your search.';
        };

        searchInput.form?.addEventListener('submit', (event) => {
            event.preventDefault();
            applyFilters();
        });

        filters.addEventListener('submit', (event) => {
            event.preventDefault();
            applyFilters();
        });

        filters.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', applyFilters);

        applyFilters();
    };

    // =========================
    // MATERIAL DETAILS, RATINGS,
    // REPORTS AND DOWNLOADS
    // =========================

    const initializeMaterialDetails = async () => {
        const id = new URLSearchParams(
            window.location.search
        ).get('id');

        const heading = document.querySelector(
            'main > section article h3'
        );

        const downloadLink = Array.from(
            document.querySelectorAll('main a')
        ).find((link) =>
            link.textContent.trim().toLowerCase() === 'download'
        );

        const ratingLink = Array.from(
            document.querySelectorAll('main a')
        ).find((link) =>
            link.textContent.trim().toLowerCase() === 'rate material'
        );

        const reportLink = Array.from(
            document.querySelectorAll('main a')
        ).find((link) =>
            link.textContent.trim().toLowerCase() === 'report material'
        );

        const materialId = id || 'sample-operating-system-notes';
        const materialTitle =
            heading?.textContent.trim() || 'Study material';

        if (ratingLink) {
            const form = document.createElement('form');
            const label = document.createElement('label');
            const select = document.createElement('select');
            const placeholder = document.createElement('option');
            const button = document.createElement('button');

            select.id = 'material-rating';
            select.name = 'rating';
            select.required = true;

            placeholder.value = '';
            placeholder.textContent = 'Choose a rating';
            select.append(placeholder);

            for (let value = 1; value <= 5; value += 1) {
                const option = document.createElement('option');
                option.value = String(value);
                option.textContent =
                    `${value} star${value === 1 ? '' : 's'}`;

                select.append(option);
            }

            label.htmlFor = select.id;
            label.textContent = 'Your rating';

            button.type = 'submit';
            button.textContent = 'Submit Rating';

            form.append(label, select, button);

            form.addEventListener('submit', (event) => {
                event.preventDefault();

                const ratings = readStoredList(ratingsKey).filter(
                    (item) => item.materialId !== materialId
                );

                ratings.push({
                    materialId,
                    rating: Number(select.value),
                    submittedAt: new Date().toISOString()
                });

                const saved = writeStoredList(ratingsKey, ratings);

                setFormStatus(
                    form,
                    saved
                        ? 'Thanks for rating this material.'
                        : 'Your rating could not be saved.',
                    !saved
                );
            });

            ratingLink.replaceWith(form);
        }

        if (reportLink) {
            const form = document.createElement('form');
            const label = document.createElement('label');
            const textarea = document.createElement('textarea');
            const button = document.createElement('button');

            textarea.id = 'material-report';
            textarea.name = 'reason';
            textarea.rows = 3;
            textarea.required = true;

            label.htmlFor = textarea.id;
            label.textContent =
                'Why are you reporting this material?';

            button.type = 'submit';
            button.textContent = 'Submit Report';

            form.append(label, textarea, button);

            form.addEventListener('submit', (event) => {
                event.preventDefault();

                const reports = readStoredList(reportsKey);

                reports.push({
                    materialId,
                    title: materialTitle,
                    reason: textarea.value.trim(),
                    submittedAt: new Date().toISOString()
                });

                const saved = writeStoredList(reportsKey, reports);

                setFormStatus(
                    form,
                    saved
                        ? 'Your report was submitted for review.'
                        : 'Your report could not be saved.',
                    !saved
                );

                if (saved) {
                    textarea.value = '';
                }
            });

            reportLink.replaceWith(form);
        }

        if (downloadLink) {
            downloadLink.addEventListener('click', async (event) => {
                event.preventDefault();

                if (!id) {
                    window.alert(
                        'This sample material does not have a downloadable file.'
                    );
                    return;
                }

                try {
                    const material = await getMaterial(id);

                    if (!material?.file) {
                        window.alert(
                            'The material file is not available in this browser.'
                        );
                        return;
                    }

                    const objectUrl = URL.createObjectURL(material.file);
                    const fileLink = document.createElement('a');

                    fileLink.href = objectUrl;
                    fileLink.download = material.fileName;

                    document.body.append(fileLink);
                    fileLink.click();
                    fileLink.remove();

                    window.setTimeout(
                        () => URL.revokeObjectURL(objectUrl),
                        60000
                    );

                    const downloads = readStoredList(downloadsKey);

                    if (!downloads.includes(id)) {
                        downloads.push(id);
                        writeStoredList(downloadsKey, downloads);
                    }
                } catch {
                    window.alert('The material could not be downloaded.');
                }
            });
        }

        if (id) {
            const material = await getMaterial(id);
            const article = document.querySelector(
                'main > section article'
            );

            if (material && article) {
                article.replaceChildren();

                const materialHeading = document.createElement('h3');
                materialHeading.textContent = material.title;
                article.append(materialHeading);

                [
                    material.course,
                    material.year,
                    material.subject,
                    material.type,
                    material.description
                ].filter(Boolean).forEach((value) => {
                    const paragraph = document.createElement('p');
                    paragraph.textContent = value;
                    article.append(paragraph);
                });
            }
        }
    };

    // =========================
    // STUDENT: MY DOWNLOADS
    // =========================

    const initializeMyDownloads = async () => {
        const databaseContainer = document.querySelector('#database-my-downloads');
        if (databaseContainer) {
            return;
        }

        const section = Array.from(
            document.querySelectorAll('main section')
        ).find((item) =>
            item.querySelector('h2')?.textContent.includes(
                'Downloaded Materials'
            )
        );

        if (!section) {
            return;
        }

        const downloadIds = readStoredList(downloadsKey);

        const materials = (await getMaterials()).filter(
            (material) => downloadIds.includes(material.id)
        );

        section.querySelectorAll('article').forEach((article) =>
            article.remove()
        );

        if (!materials.length) {
            const emptyState = document.createElement('p');
            emptyState.textContent =
                'You have not downloaded any materials yet.';

            section.append(emptyState);
            return;
        }

        materials.forEach((material) => {
            const card = createMaterialCard(material);
            const link = document.createElement('a');

            link.href =
                `../04.BrowseMaterials/materialdetails.html?id=${encodeURIComponent(material.id)}`;

            link.textContent = 'Open Material';

            card.append(link);
            section.append(card);
        });
    };

    // =========================
    // ACCOUNT PROFILE
    // =========================

    const initializeProfile = async () => {
        const form = document.querySelector('#profile-form');
        const status = document.querySelector('#profile-status');

        if (!form || !status) {
            return;
        }

        let user;
        try {
            const response = await fetch('../11.Backend/api.php?action=profile');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Could not load your profile.');
            }

            user = result.user;
        } catch (error) {
            status.textContent = error.message;
            status.setAttribute('role', 'alert');
            throw error;
        }

        form.elements.full_name.value = user.full_name;
        form.elements.program.value = user.program;
        form.elements.year_of_study.value = user.year_of_study;
        document.querySelector('#profile-email').value = user.email;
        document.querySelector('#profile-role').textContent = user.role;
        const displayName = document.querySelector('#profile-display-name');
        const displayProgram = document.querySelector('#profile-display-program');
        const displayRole = document.querySelector('#profile-display-role');
        const displayYear = document.querySelector('#profile-display-year');
        const updateProfileSummary = () => {
            displayName.textContent = form.elements.full_name.value.trim() || 'Student';
            displayProgram.textContent = form.elements.program.value.trim() || 'Program not set';
            displayRole.textContent = user.role
                ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
                : 'Student';
            displayYear.textContent = form.elements.year_of_study.selectedOptions[0]?.textContent || 'Year not set';
        };
        const photoPreview = document.querySelector('#profile-photo-preview');
        const photoPlaceholder = document.querySelector('#profile-photo-placeholder');
        const photoControls = document.querySelector('#profile-photo-controls');
        photoPlaceholder.textContent = (user.full_name || 'ShareStudy Student')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
        updateProfileSummary();
        const updatePhotoPreview = (photoPath) => {
            if (photoPath) {
                photoPreview.src = photoPath;
                photoPreview.hidden = false;
                photoPlaceholder.hidden = true;
            } else {
                photoPreview.removeAttribute('src');
                photoPreview.hidden = true;
                photoPlaceholder.hidden = false;
            }
        };

        updatePhotoPreview(user.profile_photo);
        photoControls.hidden = false;
        form.hidden = false;
        status.textContent = '';
        status.setAttribute('role', 'status');

        document.querySelector('#upload-profile-photo').addEventListener('click', async (event) => {
            const photoInput = document.querySelector('#profile-photo');
            const photo = photoInput.files[0];

            if (!photo) {
                status.textContent = 'Choose a profile photo first.';
                status.setAttribute('role', 'alert');
                return;
            }

            const button = event.currentTarget;
            button.disabled = true;
            status.textContent = 'Uploading your profile photo...';

            try {
                const photoData = new FormData();
                photoData.append('profile_photo', photo);
                const uploadResponse = await fetch(
                    '../11.Backend/api.php?action=upload_profile_photo',
                    { method: 'POST', body: photoData }
                );
                const uploadResult = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(
                        uploadResult.error || 'Could not upload your profile photo.'
                    );
                }

                updatePhotoPreview(uploadResult.profile_photo);
                photoInput.value = '';
                status.textContent = 'Your profile photo has been uploaded.';
                status.setAttribute('role', 'status');
            } catch (error) {
                status.textContent = error.message;
                status.setAttribute('role', 'alert');
            } finally {
                button.disabled = false;
            }
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitButton = form.querySelector('[type="submit"]');
            submitButton.disabled = true;
            status.textContent = 'Saving your profile...';

            try {
                const updateResponse = await fetch(
                    '../11.Backend/api.php?action=update_profile',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams(new FormData(form))
                    }
                );
                const updateResult = await updateResponse.json();

                if (!updateResponse.ok) {
                    throw new Error(
                        updateResult.error || 'Could not save your profile.'
                    );
                }

                updateProfileSummary();
                status.textContent = 'Your profile has been updated.';
                status.setAttribute('role', 'status');
            } catch (error) {
                status.textContent = error.message;
                status.setAttribute('role', 'alert');
            } finally {
                submitButton.disabled = false;
            }
        });
    };

    // =========================
    // ADMIN: USER REPORTS
    // =========================

    const initializeReports = () => {
        const section = Array.from(
            document.querySelectorAll('main section')
        ).find((item) =>
            item.querySelector('h2')?.textContent.includes('Users Reports')
        );

        if (!section) {
            return;
        }

        const reports = readStoredList(reportsKey);

        const emptyMessages = Array.from(
            section.querySelectorAll('p')
        ).filter((paragraph) =>
            paragraph.textContent.toLowerCase().includes('no reports')
        );

        emptyMessages.forEach((message) => {
            message.hidden = reports.length > 0;
        });

        const list = document.createElement('div');

        reports.forEach((report) => {
            const article = document.createElement('article');
            const heading = document.createElement('h3');
            const reason = document.createElement('p');
            const date = document.createElement('p');

            heading.textContent = `Report: ${report.title}`;
            reason.textContent = `Reason: ${report.reason}`;
            date.textContent =
                `Submitted: ${new Date(report.submittedAt).toLocaleDateString()}`;

            article.append(heading, reason, date);
            list.append(article);
        });

        section.querySelector('[data-report-list]')?.remove();

        list.dataset.reportList = '';
        section.append(list);
    };

    // =========================
    // INITIALIZE PAGE FEATURES
    // =========================

    const safelyInitialize = (initializer) => {
        initializer().catch((error) => {
            console.error('ShareStudy feature could not initialize:', error);
        });
    };

    initializeSessionNavigation();
    initializeLoginAccountType();
    initializeLoginForm();
    initializePasswordMatch();
    safelyInitialize(initializeMyUploads);
    safelyInitialize(initializeAdminMaterials);
    safelyInitialize(initializeSearch);
    safelyInitialize(initializeMaterialDetails);
    safelyInitialize(initializeMyDownloads);
    safelyInitialize(initializeProfile);

    initializeReports();
})();

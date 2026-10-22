(() => {
    const api = '../11.Backend/api.php';
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);

    const readJson = async (response) => {
        const body = await response.text();
        try {
            return JSON.parse(body);
        } catch (error) {
            if (!(error instanceof SyntaxError)) {
                throw error;
            }
            throw new Error(
                `The server returned a webpage instead of JSON from ${response.url} (HTTP ${response.status}). Check that Apache/PHP is running and open ShareStudy through localhost.`
            );
        }
    };

    const get = async (action, parameters = '') => {
        const response = await fetch(`${api}?action=${encodeURIComponent(action)}${parameters}`, {
            credentials: 'same-origin'
        });
        const result = await readJson(response);
        if (!response.ok) {
            throw new Error(result.error || 'Could not load records.');
        }
        return result;
    };

    const post = async (action, body) => {
        const response = await fetch(`${api}?action=${encodeURIComponent(action)}`, {
            method: 'POST',
            credentials: 'same-origin',
            body
        });
        const result = await readJson(response);
        if (!response.ok) {
            throw new Error(result.error || 'Request failed.');
        }
        return result;
    };

    const normalize = (value) =>
        String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    const requireBrowseSession = async () => {
        const protectedPages = [
            'browsematerials.html',
            'courseyearsubject.html',
            'searchfilter.html',
            'materialdetails.html'
        ];
        const page = window.location.pathname.toLowerCase().split('/').pop();
        if (!protectedPages.includes(page)) {
            return true;
        }

        const response = await fetch(`${api}?action=session`, {
            credentials: 'same-origin'
        });
        if (response.status === 401) {
            window.location.replace(
                '../02.Login-Register/login.html?next=browse&browse_required=1'
            );
            return false;
        }
        if (!response.ok) {
            throw new Error('Could not verify your ShareStudy account.');
        }
        await readJson(response);
        return true;
    };

    const initializeSessionNavigation = async () => {
        const navs = document.querySelectorAll('header nav');
        if (!navs.length) {
            return;
        }

        document.querySelectorAll('header nav a').forEach((link) => {
            const path = (link.getAttribute('href') || '').toLowerCase();
            const label = normalize(link.textContent);
            if (path.includes('06.admin/') || label === 'admin' || label === 'manage site') {
                link.closest('li')?.setAttribute('hidden', '');
            }
        });

        try {
            const response = await fetch(`${api}?action=session`, {
                credentials: 'same-origin'
            });
            if (response.status === 401) {
                document.querySelectorAll('header nav a').forEach((link) => {
                    const href = link.getAttribute('href') || '';
                    const path = href.toLowerCase();
                    const label = normalize(link.textContent);
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
                const href = link.getAttribute('href') || '';
                const path = href.toLowerCase();
                const label = normalize(link.textContent);
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

    initializeSessionNavigation();

    const materialCards = (materials, action = '') => {
        if (!materials.length) {
            return '<p>No matching records were found.</p>';
        }

        return materials.map((material) => {
            const isDownload = action === 'downloads';
            const canOpen = isDownload || !material.status || material.status === 'approved';
            return `<article class="material-card">
                <h3>${escapeHtml(material.title)}</h3>
                <p><strong>Course:</strong> ${escapeHtml(material.course)}</p>
                <p><strong>Subject:</strong> ${escapeHtml(material.subject)}</p>
                <p><strong>Year:</strong> ${escapeHtml(material.academic_year || 'Not specified')}</p>
                <p><strong>Type:</strong> ${escapeHtml(material.material_type || 'Not specified')}</p>
                ${material.description ? `<p>${escapeHtml(material.description)}</p>` : ''}
                ${material.status ? `<p><strong>Status:</strong> ${escapeHtml(material.status)}</p>` : ''}
                ${isDownload ? `<p><strong>Downloaded:</strong> ${escapeHtml(material.downloaded_at)}</p>` : ''}
                ${material.uploader ? `<p><strong>Uploaded by:</strong> ${escapeHtml(material.uploader)}</p>` : ''}
                ${canOpen ? `<p><a href="../04.BrowseMaterials/materialdetails.html?id=${encodeURIComponent(material.id)}">View details</a></p>` : ''}
                ${material.status === 'pending' ? `<button data-moderate="approved" data-id="${escapeHtml(material.id)}">Approve</button> <button data-moderate="rejected" data-id="${escapeHtml(material.id)}">Reject</button>` : ''}
                ${material.file_path && (isDownload || material.status === 'approved') ? `<p><a href="../11.Backend/download.php?id=${encodeURIComponent(material.id)}">Download material</a></p>` : ''}
            </article>`;
        }).join('');
    };

    const fillMaterials = async (element, action) => {
        if (!element) {
            return;
        }

        try {
            const result = await get(action);
            element.innerHTML = materialCards(result.materials || [], action);
        } catch (error) {
            element.textContent = error.message;
            element.setAttribute('role', 'alert');
        }
    };

    const fillUsers = async (element) => {
        if (!element) {
            return;
        }

        try {
            const { users } = await get('users');
            element.innerHTML = users.length
                ? `<table><thead><tr><th>Name</th><th>Email</th><th>Program</th><th>Year</th><th>Role</th></tr></thead><tbody>${users.map((user) => `<tr><td>${escapeHtml(user.full_name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.program)}</td><td>${escapeHtml(user.year_of_study)}</td><td>${escapeHtml(user.role)}</td></tr>`).join('')}</tbody></table>`
                : '<p>No users found.</p>';
        } catch (error) {
            element.textContent = error.message;
            element.setAttribute('role', 'alert');
        }
    };

    const fillReports = async (element) => {
        if (!element) {
            return;
        }

        try {
            const { reports } = await get('reports');
            if (!reports.length) {
                element.textContent = 'No reports are currently available.';
                return;
            }
            element.innerHTML = reports.map((report) => `<article>
                <h3>${escapeHtml(report.material_title)}</h3>
                <p><strong>Reported by:</strong> ${escapeHtml(report.reporter)}</p>
                <p><strong>Reason:</strong> ${escapeHtml(report.reason)}</p>
                <p><strong>Details:</strong> ${escapeHtml(report.details || 'None provided')}</p>
                <p><strong>Status:</strong> ${escapeHtml(report.status)}</p>
                <p><strong>Submitted:</strong> ${escapeHtml(report.created_at)}</p>
                ${report.status === 'pending' ? `<button type="button" data-report-status="reviewed" data-id="${escapeHtml(report.id)}">Mark reviewed</button>` : ''}
                ${report.status !== 'resolved' ? `<button type="button" data-report-status="resolved" data-id="${escapeHtml(report.id)}">Resolve</button>` : ''}
            </article>`).join('');
        } catch (error) {
            element.textContent = error.message;
            element.setAttribute('role', 'alert');
        }
    };

    const fillSubscriptions = async (element) => {
        if (!element) {
            return;
        }

        try {
            const { subscriptions } = await get('subscriptions');
            element.innerHTML = subscriptions.length
                ? subscriptions.map((subscription) => `<article>
                    <h3>${escapeHtml(subscription.plan)} plan - ${escapeHtml(subscription.currency || 'ZMW')} ${escapeHtml(subscription.amount)}</h3>
                    <p><strong>Account:</strong> ${escapeHtml(subscription.full_name)} (${escapeHtml(subscription.email)})</p>
                    <p><strong>Status:</strong> ${escapeHtml(subscription.status.replaceAll('_', ' '))}</p>
                    <p><strong>Requested:</strong> ${escapeHtml(subscription.created_at)}</p>
                    ${subscription.paid_at ? `<p><strong>Paid:</strong> ${escapeHtml(subscription.paid_at)}</p>` : ''}
                    ${subscription.expires_at ? `<p><strong>Expires:</strong> ${escapeHtml(subscription.expires_at)}</p>` : ''}
                    ${subscription.status === 'pending_payment' ? '<p>Waiting for Flutterwave payment confirmation.</p>' : ''}
                </article>`).join('')
                : '<p>No subscription requests are currently available.</p>';
        } catch (error) {
            element.textContent = error.message;
            element.setAttribute('role', 'alert');
        }
    };

    const populateFilters = (form, materials) => {
        const sources = {
            course: { field: 'course', allLabel: 'Any program (show all)', getValue: (material) => material.course },
            year: { field: 'academic_year', label: 'year', getValue: (material) => material.academic_year },
            subject: { field: 'subject', allLabel: 'Any course (show all)', getValue: (material) => material.subject },
            type: { field: 'material_type', label: 'type', getValue: (material) => material.material_type }
        };

        Object.entries(sources).forEach(([name, { field, label, allLabel, getValue }]) => {
            const select = form.elements.namedItem(name);
            if (!select) {
                return;
            }

            const currentValue = new URLSearchParams(window.location.search).get(name) || '';
            const values = [...new Set(materials.map(getValue).filter(Boolean))];
            select.replaceChildren(new Option(allLabel || `All ${label}s`, ''));
            values.sort().forEach((value) => select.add(new Option(value, value)));
            select.value = values.find((value) => normalize(value) === normalize(currentValue)) || '';
        });
    };

    const initializeMaterialSearch = async () => {
        const results = document.getElementById('database-materials');
        if (!results) {
            return;
        }

        try {
            const { materials } = await get('materials');
            const search = document.getElementById('search');
            const searchForm = document.getElementById('material-search');
            const filterForm = document.getElementById('material-filters');
            if (search) {
                search.value = new URLSearchParams(window.location.search).get('search') || '';
            }
            if (filterForm) {
                populateFilters(filterForm, materials);
            }

            const apply = () => {
                const query = normalize(search?.value);
                const names = ['course', 'year', 'subject', 'type'];
                const filters = filterForm
                    ? names.map((name) => normalize(filterForm.elements.namedItem(name)?.value))
                    : [];
                const fields = ['course', 'academic_year', 'subject', 'material_type'];
                const matching = materials.filter((material) => {
                    const searchable = normalize([
                        material.title,
                        material.description,
                        material.course,
                        material.subject,
                        material.academic_year,
                        material.material_type
                    ].join(' '));
                    return (!query || searchable.includes(query)) &&
                        filters.every((value, index) =>
                            !value || normalize(material[fields[index]]) === value
                        );
                });
                results.innerHTML = materialCards(matching);
            };

            search?.addEventListener('input', apply);
            searchForm?.addEventListener('submit', (event) => {
                event.preventDefault();
                apply();
            });
            filterForm?.addEventListener('submit', (event) => {
                event.preventDefault();
                apply();
            });
            filterForm?.addEventListener('change', apply);
            apply();
        } catch (error) {
            results.textContent = error.message;
            results.setAttribute('role', 'alert');
        }
    };

    const initializeMaterialDetails = async () => {
        const article = document.querySelector('[data-database-material]');
        if (!article) {
            return;
        }

        const materialId = new URLSearchParams(window.location.search).get('id');
        if (!materialId) {
            article.textContent = 'Select a material from Browse Materials to view its details.';
            return;
        }

        try {
            const { material } = await get('material', `&id=${encodeURIComponent(materialId)}`);
            article.innerHTML = `<h3>${escapeHtml(material.title)}</h3>
                <p><strong>Course:</strong> ${escapeHtml(material.course)}</p>
                <p><strong>Year:</strong> ${escapeHtml(material.academic_year || 'Not specified')}</p>
                <p><strong>Subject:</strong> ${escapeHtml(material.subject)}</p>
                <p><strong>Type:</strong> ${escapeHtml(material.material_type || 'Not specified')}</p>
                ${material.description ? `<p><strong>Description:</strong> ${escapeHtml(material.description)}</p>` : ''}
                <p><strong>Uploaded by:</strong> ${escapeHtml(material.uploader)}</p>
                <p><strong>Rating:</strong> ${escapeHtml(material.average_rating.average_rating || 'Not rated')} (${escapeHtml(material.average_rating.rating_count)} ratings)</p>
                <p><a href="../11.Backend/download.php?id=${encodeURIComponent(material.id)}">Download</a></p>`;
            initializeFeedbackForms(material.id);
        } catch (error) {
            article.textContent = error.message;
            article.setAttribute('role', 'alert');
        }
    };

    const initializeFeedbackForms = (materialId) => {
        const actions = document.querySelector('main section:nth-of-type(2)');
        if (!actions) {
            return;
        }
        actions.innerHTML = `<h2>Material Actions</h2>
            <form id="rating-form">
                <label for="rating">Rate this material</label>
                <select id="rating" name="rating" required>
                    <option value="">Choose a rating</option>
                    <option value="5">5 stars</option><option value="4">4 stars</option>
                    <option value="3">3 stars</option><option value="2">2 stars</option>
                    <option value="1">1 star</option>
                </select>
                <label for="rating-comment">Comment (optional)</label>
                <textarea id="rating-comment" name="comment" rows="3"></textarea>
                <button type="submit">Submit Rating</button>
                <p data-feedback-status role="status" aria-live="polite"></p>
            </form>
            <form id="report-form">
                <label for="report-reason">Report reason</label>
                <select id="report-reason" name="reason" required>
                    <option value="">Choose a reason</option>
                    <option>Incorrect or misleading content</option>
                    <option>Copyright or ownership concern</option>
                    <option>Inappropriate content</option>
                    <option>File is damaged or unreadable</option>
                    <option>Other</option>
                </select>
                <label for="report-details">Details</label>
                <textarea id="report-details" name="details" rows="3"></textarea>
                <button type="submit">Submit Report</button>
                <p data-feedback-status role="status" aria-live="polite"></p>
            </form>`;

        [['rating-form', 'rate'], ['report-form', 'report']].forEach(([formId, action]) => {
            const form = document.getElementById(formId);
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const status = form.querySelector('[data-feedback-status]');
                const button = form.querySelector('[type="submit"]');
                const values = new FormData(form);
                values.append('material_id', materialId);
                button.disabled = true;
                status.textContent = 'Submitting...';

                try {
                    await post(action, values);
                    status.textContent = action === 'rate'
                        ? 'Thanks. Your rating has been saved.'
                        : 'Your report has been sent to the administrators.';
                    form.reset();
                } catch (error) {
                    status.textContent = error.message;
                    status.setAttribute('role', 'alert');
                } finally {
                    button.disabled = false;
                }
            });
        });
    };

    const guardAdminPage = async () => {
        if (!window.location.pathname.toLowerCase().includes('/06.admin/')) {
            return;
        }

        try {
            const { role } = await get('session');
            if (role !== 'admin') {
                window.location.replace('../02.Login-Register/login.html?access_denied=1');
            }
        } catch {
            window.location.replace('../02.Login-Register/login.html?access_denied=1');
        }
    };

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            if (!(await requireBrowseSession())) {
                return;
            }
        } catch (error) {
            const results = document.getElementById('database-materials');
            if (results) {
                results.textContent = error.message;
                results.setAttribute('role', 'alert');
            }
            console.error('ShareStudy could not verify access to study materials:', error);
            return;
        }

        const query = new URLSearchParams(window.location.search);
        if (query.get('uploaded') === '1') {
            const notice = document.createElement('p');
            notice.setAttribute('role', 'status');
            notice.textContent = 'Your material was uploaded successfully and is waiting for admin approval.';
            document.querySelector('main section')?.prepend(notice);
        }

        guardAdminPage();
        fillMaterials(document.getElementById('database-my-uploads'), 'my_uploads');
        fillMaterials(document.getElementById('database-my-downloads'), 'downloads');
        fillMaterials(document.getElementById('database-pending'), 'pending');
        fillMaterials(document.getElementById('database-approved'), 'approved');
        fillMaterials(document.getElementById('database-rejected'), 'rejected');
        fillUsers(document.getElementById('database-users'));
        fillReports(document.getElementById('database-reports'));
        fillSubscriptions(document.getElementById('database-subscriptions'));
        initializeMaterialSearch();
        initializeMaterialDetails();

        document.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-moderate], [data-report-status]');
            if (!button) {
                return;
            }

            button.disabled = true;
            const data = new FormData();
            data.append('id', button.dataset.id);
            if (button.dataset.moderate) {
                data.append('status', button.dataset.moderate);
            }
            if (button.dataset.reportStatus) {
                data.append('status', button.dataset.reportStatus);
            }
            try {
                if (button.dataset.moderate) {
                    await post('moderate', data);
                    button.closest('article').remove();
                } else if (button.dataset.reportStatus) {
                    await post('report_status', data);
                    window.location.reload();
                }
            } catch (error) {
                window.alert(error.message);
                button.disabled = false;
            }
        });
    });
})();

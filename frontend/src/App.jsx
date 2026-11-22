import {useEffect,  useState } from "react";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Plus,
  List,
  ChartNoAxesColumn,
  Search,
  ArrowUpRight,
  CalendarCheck,
  Trophy,
  XCircle,
  Menu,
  X,
  Pencil,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "Applied",
    job_link: "",
  });
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
  async function loadJobs() {
    try {
      const response = await fetch("http://127.0.0.1:8000/jobs");

      if (!response.ok) {
        throw new Error("Could not load applications.");
      }

      const data = await response.json();
      setJobs(data);
      setApiError("");
    } catch (error) {
      setApiError(
        "Unable to connect to the backend. Check that FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  loadJobs();
}, []);

  const stats = [
    {
      label: "Total Applications",
      value: jobs.length,
      icon: BriefcaseBusiness,
    },
    {
      label: "Interviews",
      value: jobs.filter((j) => j.status === "Interview").length,
      icon: CalendarCheck,
    },
    {
      label: "Offers",
      value: jobs.filter((j) => j.status === "Offered").length,
      icon: Trophy,
    },
    {
      label: "Rejected",
      value: jobs.filter((j) => j.status === "Rejected").length,
      icon: XCircle,
    },
  ];

  const filteredJobs = jobs.filter((job) => {
  const term = search.toLowerCase();

  const matchesSearch =
    job.company.toLowerCase().includes(term) ||
    job.role.toLowerCase().includes(term);

  const matchesStatus =
    statusFilter === "All" || job.status === statusFilter;

  return matchesSearch && matchesStatus;
});

async function addJob(event) {
  event.preventDefault();
  setApiError("");

  const isEditing = Boolean(editingJob);

  const url = isEditing
    ? `${API_URL}/jobs/${editingJob.id}`
    : `${API_URL}/jobs`;

  try {
    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        job_link: form.job_link || null,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save the application.");
    }

    const savedJob = await response.json();

    if (isEditing) {
      setJobs((current) =>
        current.map((job) =>
          job.id === savedJob.id ? savedJob : job
        )
      );
    } else {
      setJobs((current) => [savedJob, ...current]);
    }

    setForm({
      company: "",
      role: "",
      status: "Applied",
      job_link: "",
    });

    setEditingJob(null);
    setShowForm(false);
    setActivePage("All Applications");
  } catch (error) {
    setApiError(error.message);
  }
}
function startEdit(job) {
  setEditingJob(job);

  setForm({
    company: job.company,
    role: job.role,
    status: job.status,
    job_link: job.job_link || "",
  });

  setShowForm(true);
}

 async function deleteJob(id) {
  setApiError("");

  try {
    const response = await fetch(`${API_URL}/jobs/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete the application.");
    }

    setJobs((current) => current.filter((job) => job.id !== id));
  } catch (error) {
    setApiError(error.message);
  }
}
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Add Job", icon: Plus },
    { label: "All Applications", icon: List },
    { label: "Statistics", icon: ChartNoAxesColumn },
  ];

  function navigate(label) {
    if (label === "Add Job") {
      setShowForm(true);
    } else {
      setActivePage(label);
    }

    setMobileMenu(false);
  }

  const displayedJobs =
    activePage === "Dashboard" ? filteredJobs.slice(0, 5) : filteredJobs;

  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="mobile-overlay"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <BriefcaseBusiness size={23} />
          </div>
          <span>JobTrack</span>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav className="navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "nav-active" : ""
              }`}
              onClick={() => navigate(label)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-mark">JT</div>
          <div>
            <strong>JobTrack</strong>
            <span>Plan. Apply. Get hired.</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="avatar" title="Your profile">
            P
          </div>
        </header>

        <section className="page-content">
          {apiError && (
  <div className="api-error" role="alert">
    {apiError}
  </div>
)}

{loading && (
  <p className="loading-message">
    Loading your applications...
  </p>
)}
          <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR JOB SEARCH</p>
              <h1>
                {activePage === "Dashboard"
                  ? "Welcome back!"
                  : activePage}
              </h1>
              <p className="subtitle">
                Keep your applications organized and your goals in sight.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              Add application
            </button>
          </div>

          <section className="stats-grid" aria-label="Application statistics">
            {stats.map(({ label, value, icon: Icon }, index) => (
              <article className="stat-card" key={label}>
                <div className={`stat-icon stat-icon-${index}`}>
                  <Icon size={21} strokeWidth={1.8} />
                </div>
                <div className="stat-info">
                  <p>{label}</p>
                  <h2>{value}</h2>
                </div>
                <span className="stat-dot" />
              </article>
            ))}
          </section>

          {activePage === "Statistics" ? (
            <section className="panel statistics-panel">
              <div className="panel-heading">
                <div>
                  <h2>Application overview</h2>
                  <p>Your current job search at a glance.</p>
                </div>
              </div>

              {stats.map(({ label, value }, index) => (
                <div className="progress-row" key={label}>
                  <div className="progress-label">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill progress-fill-${index}`}
                      style={{
                        width: `${jobs.length ? (value / jobs.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>
          ) : (
            <section className="panel applications-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {activePage === "Dashboard"
                      ? "Recent applications"
                      : "All applications"}
                  </h2>
                  <p>
                    {activePage === "Dashboard"
                      ? "Keep track of your latest opportunities."
                      : `${filteredJobs.length} application${
                          filteredJobs.length === 1 ? "" : "s"
                        } in your list`}
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setActivePage("All Applications")}
                >
                  View all <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search company or role..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select
  className="status-filter"
  value={statusFilter}
  onChange={(event) => setStatusFilter(event.target.value)}
  aria-label="Filter applications by status"
>
  <option value="All">All statuses</option>
  <option value="Applied">Applied</option>
  <option value="Interview">Interview</option>
  <option value="Rejected">Rejected</option>
  <option value="Offered">Offered</option>
</select>
                </div>
                <span className="result-count">
                  {filteredJobs.length} results
                </span>
              </div>

              {displayedJobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <BriefcaseBusiness size={28} strokeWidth={1.5} />
                  </div>
                  <h3>
                    {search
                      ? "No matching applications"
                      : "Your next opportunity starts here"}
                  </h3>
                  <p>
                    {search
                      ? "Try searching for a different company or role."
                      : "Add your first application to start tracking your progress."}
                  </p>
                  {!search && (
                    <button
                      className="primary-button"
                      onClick={() => setShowForm(true)}
                    >
                      <Plus size={18} />
                      Add your first job
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="jobs-table">
                    <thead>
                      <tr>
                        <th>COMPANY & ROLE</th>
                        <th>STATUS</th>
                        <th>JOB LINK</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedJobs.map((job) => (
                        <tr key={job.id}>
                          <td>
                            <div className="company-cell">
                              <div className="company-avatar">
                                {job.company.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{job.company}</strong>
                                <span>{job.role}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-badge status-${job.status.toLowerCase()}`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td>
                            {job.job_link ? (
                              <a
                                className="job-link"
                                href={job.job_link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open link <ArrowUpRight size={14} />
                              </a>
                            ) : (
                              <span className="muted-text">—</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
  <button
    className="edit-button"
    onClick={() => startEdit(job)}
    aria-label={`Edit ${job.company}`}
    title="Edit application"
  >
    <Pencil size={16} />
  </button>

  <button
    className="delete-button"
    onClick={() => deleteJob(job.id)}
    aria-label={`Delete ${job.company}`}
    title="Delete application"
  >
    <X size={17} />
  </button>
</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <footer className="page-footer">
            <span>Made for your next career move.</span>
            <span>JobTrack · Personal workspace</span>
          </footer>
        </section>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="job-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">NEW OPPORTUNITY</p>
                <h2 id="modal-title">
  {editingJob ? "Edit application" : "Add application"}
</h2>
                <p>Save the details so you can follow up later.</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addJob}>
              <label>
                Company name <span>*</span>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.company}
                  onChange={(event) =>
                    setForm({ ...form, company: event.target.value })
                  }
                  placeholder="e.g. TCS"
                />
              </label>

              <label>
                Job role <span>*</span>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.role}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value })
                  }
                  placeholder="e.g. Python Developer"
                />
              </label>

              <label>
                Application status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Rejected</option>
                  <option>Offered</option>
                </select>
              </label>

              <label>
                Job posting URL
                <input
                  type="url"
                  value={form.job_link}
                  onChange={(event) =>
                    setForm({ ...form, job_link: event.target.value })
                  }
                  placeholder="https://company.com/careers"
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
  {editingJob ? <Pencil size={17} /> : <Plus size={17} />}
  {editingJob ? "Save changes" : "Save application"}
</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;

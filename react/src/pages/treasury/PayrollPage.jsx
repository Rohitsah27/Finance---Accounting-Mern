import React, { useState, useMemo } from 'react';

const INITIAL_EMPLOYEES = [
  { id: 'EMP-001', name: 'Marcus Whitfield', dept: 'Manufacturing', payType: 'Salary', rate: '$78,500 /yr', filing: 'Single', status: 'Active' },
  { id: 'EMP-002', name: 'Priya Nandakumar', dept: 'Finance', payType: 'Salary', rate: '$96,200 /yr', filing: 'Married Filing Jointly', status: 'Active' },
  { id: 'EMP-003', name: 'Devon Ackerman', dept: 'Operations', payType: 'Hourly', rate: '$28.50 /hr', filing: 'Single', status: 'Active' },
  { id: 'EMP-004', name: 'Renata Osei', dept: 'Sales', payType: 'Salary', rate: '$64,000 /yr', filing: 'Head of Household', status: 'Active' },
  { id: 'EMP-005', name: 'Tobias Klein', dept: 'Manufacturing', payType: 'Hourly', rate: '$24.75 /hr', filing: 'Married Filing Jointly', status: 'Active' },
  { id: 'EMP-006', name: 'Simone Vasquez', dept: 'Finance', payType: 'Salary', rate: '$112,000 /yr', filing: 'Single', status: 'Active' },
  { id: 'EMP-007', name: 'Aaron Feldstein', dept: 'Operations', payType: 'Hourly', rate: '$21.00 /hr', filing: 'Single', status: 'On Leave' },
  { id: 'EMP-008', name: 'Latoya Simmons', dept: 'Sales', payType: 'Salary', rate: '$71,500 /yr', filing: 'Married Filing Jointly', status: 'Active' },
];

export function PayrollPage() {
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedPayType, setSelectedPayType] = useState('All Pay Types');
  const [searchEmp, setSearchEmp] = useState('');
  
  // Pay Run status
  const [currentPayRunStatus, setCurrentPayRunStatus] = useState('Draft');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleProcessPayroll = () => {
    setIsProcessing(true);
    showToast('Step 1/3: Calculating gross pay for 142 employees...', 'info');
    setTimeout(() => {
      showToast('Step 2/3: Applying SS (6.2%), Medicare (1.45%), and FUTA withholding...', 'info');
      setTimeout(() => {
        showToast('Step 3/3: Posting journal entries and generating pay stubs...', 'info');
        setTimeout(() => {
          setCurrentPayRunStatus('Approved');
          setIsProcessing(false);
          showToast('Payroll run approved - $243,120 gross / $178,480 net', 'success');
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const filteredEmployees = useMemo(() => {
    const q = searchEmp.toLowerCase();
    return INITIAL_EMPLOYEES.filter(e => {
      if (selectedDept !== 'All Departments' && e.dept !== selectedDept) return false;
      if (selectedPayType !== 'All Pay Types' && e.payType !== selectedPayType) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.dept.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [selectedDept, selectedPayType, searchEmp]);

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header">
        <div>
          <div className="page-title">Payroll</div>
          <div className="page-subtitle">
            Employee master, pay runs, statutory filings (Form 941, W-2 e-filing), and benefit deductions
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting payroll register...', 'info')}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => showToast('New employee onboarding modal opened', 'info')}>
            + New Employee
          </button>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8" cy="6" r="2.6" stroke="#102a2e" strokeWidth="1.5"/>
              <path d="M2.5 17c0-3.1 2.4-5.6 5.5-5.6s5.5 2.5 5.5 5.6" stroke="#102a2e" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="15" cy="7" r="2" stroke="#102a2e" strokeWidth="1.3"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">142</div>
            <div className="stat-label">Active Employees</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 12l4-5 3 3 6-7" stroke="#2e7d32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">$486,240</div>
            <div className="stat-label">This Period's Gross Pay</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="#e65100" strokeWidth="1.6"/>
              <path d="M6 8h8M6 11h5" stroke="#e65100" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">$118,340</div>
            <div className="stat-label">Total Tax Withheld</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="13" rx="1.5" stroke="#c9791f" strokeWidth="1.5"/>
              <path d="M3 8h14" stroke="#c9791f" strokeWidth="1.5"/>
              <path d="M7 2v4M13 2v4" stroke="#c9791f" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">Sep 4, 2026</div>
            <div className="stat-label">Next Pay Date</div>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="page-tabs">
        <button
          className={`page-tab ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Employee Master
        </button>
        <button
          className={`page-tab ${activeTab === 'payruns' ? 'active' : ''}`}
          onClick={() => setActiveTab('payruns')}
        >
          Pay Runs
        </button>
        <button
          className={`page-tab ${activeTab === 'statutory' ? 'active' : ''}`}
          onClick={() => setActiveTab('statutory')}
        >
          Statutory Filings
        </button>
        <button
          className={`page-tab ${activeTab === 'benefits' ? 'active' : ''}`}
          onClick={() => setActiveTab('benefits')}
        >
          Benefits &amp; Deductions
        </button>
      </div>

      {/* ── 1. EMPLOYEE MASTER ── */}
      {activeTab === 'employees' && (
        <>
          <div className="filter-bar" style={{ borderRadius: 0 }}>
            <span className="filter-bar-label">Filters:</span>
            <select
              className="filter-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option>All Departments</option>
              <option>Manufacturing</option>
              <option>Sales</option>
              <option>Finance</option>
              <option>Operations</option>
            </select>
            <select
              className="filter-select"
              value={selectedPayType}
              onChange={(e) => setSelectedPayType(e.target.value)}
            >
              <option>All Pay Types</option>
              <option>Salary</option>
              <option>Hourly</option>
            </select>
            <div className="filter-spacer"></div>
            <input
              type="text"
              className="filter-input"
              placeholder="Search employee..."
              value={searchEmp}
              onChange={(e) => setSearchEmp(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
          <div className="table-wrap" style={{ borderRadius: '0 0 var(--radius, 8px) var(--radius, 8px)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '32px' }}><input type="checkbox" className="table-check" /></th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Pay Type</th>
                  <th style={{ textAlign: 'right' }}>Annual Salary / Rate</th>
                  <th>Filing Status</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e) => (
                  <tr key={e.id}>
                    <td><input type="checkbox" className="table-check" /></td>
                    <td className="cell-link">{e.name}</td>
                    <td>{e.dept}</td>
                    <td>
                      <span className={`badge ${e.payType === 'Salary' ? 'badge-navy' : 'badge-blue'}`}>
                        {e.payType}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{e.rate}</td>
                    <td>{e.filing}</td>
                    <td>
                      <span className={`badge ${e.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Editing record for ${e.name}`, 'info')}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 2. PAY RUNS ── */}
      {activeTab === 'payruns' && (
        <>
          <div className="table-wrap">
            <div className="table-head-row">
              <div className="table-head-title">Pay Runs</div>
              <div className="table-head-actions">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={isProcessing || currentPayRunStatus === 'Approved'}
                  onClick={handleProcessPayroll}
                >
                  {isProcessing ? 'Processing…' : currentPayRunStatus === 'Approved' ? 'Payroll Approved ✓' : 'Process Payroll'}
                </button>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pay Period</th>
                  <th>Run Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Gross Total</th>
                  <th style={{ textAlign: 'right' }}>Net Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">08/16/2026 – 08/31/2026</td>
                  <td>09/04/2026</td>
                  <td>
                    <span className={`badge ${currentPayRunStatus === 'Approved' ? 'badge-green' : 'badge-gray'}`}>
                      {currentPayRunStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>$243,120</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>$178,480</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast('Viewing pay run summary', 'info')}>
                      View
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">08/01/2026 – 08/15/2026</td>
                  <td>08/20/2026</td>
                  <td><span className="badge badge-green">Paid</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>$241,860</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>$177,610</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast('Viewing past pay run', 'info')}>
                      View
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">07/16/2026 – 07/31/2026</td>
                  <td>08/05/2026</td>
                  <td><span className="badge badge-green">Paid</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>$239,940</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>$176,220</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast('Viewing past pay run', 'info')}>
                      View
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">07/01/2026 – 07/15/2026</td>
                  <td>07/20/2026</td>
                  <td><span className="badge badge-green">Paid</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>$238,500</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>$175,180</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast('Viewing past pay run', 'info')}>
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: '16px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0d1b4b', marginBottom: '10px' }}>
              Statutory Withholding Rates Applied
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--color-muted, #64748b)' }}>
              <div><strong style={{ color: '#0d1b4b' }}>Social Security (OASDI):</strong> 6.2% up to the annual wage base</div>
              <div><strong style={{ color: '#0d1b4b' }}>Medicare:</strong> 1.45% (+0.9% Additional Medicare over $200,000)</div>
              <div><strong style={{ color: '#0d1b4b' }}>FUTA:</strong> 0.6% effective rate on first $7,000 per employee</div>
            </div>
          </div>
        </>
      )}

      {/* ── 3. STATUTORY FILINGS ── */}
      {activeTab === 'statutory' && (
        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Statutory Filings</div>
            <div className="table-head-actions">
              <button className="btn btn-outline btn-sm" onClick={() => showToast('W-2 e-file batch queued with SSA', 'success')}>
                E-File W-2s
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Filing</th>
                <th>Type</th>
                <th>Period</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">Form 941 - Q2 2026</td>
                <td>Federal Quarterly</td>
                <td>Apr–Jun 2026</td>
                <td>07/31/2026</td>
                <td><span className="badge badge-green">Filed</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('Form 941 Q2 PDF ready', 'info')}>View</button></td>
              </tr>
              <tr>
                <td className="font-semibold">Form 941 - Q3 2026</td>
                <td>Federal Quarterly</td>
                <td>Jul–Sep 2026</td>
                <td>10/31/2026</td>
                <td><span className="badge badge-orange">Pending</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('Draft Form 941 generated', 'info')}>Prepare</button></td>
              </tr>
              <tr>
                <td className="font-semibold">Form W-2 - Tax Year 2025</td>
                <td>Federal Annual</td>
                <td>Jan–Dec 2025</td>
                <td>01/31/2026</td>
                <td><span className="badge badge-green">E-Filed with SSA</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('W-2 register opened', 'info')}>View</button></td>
              </tr>
              <tr>
                <td className="font-semibold">Form W-2 - Tax Year 2026</td>
                <td>Federal Annual</td>
                <td>Jan–Dec 2026</td>
                <td>01/31/2027</td>
                <td><span className="badge badge-gray">Not Yet Due</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('W-2 2026 preparation wizard', 'info')}>Prepare</button></td>
              </tr>
              <tr>
                <td className="font-semibold">Texas Workforce Commission - Q2</td>
                <td>State Unemployment</td>
                <td>Apr–Jun 2026</td>
                <td>07/31/2026</td>
                <td><span className="badge badge-green">Filed</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('TWC filing receipt displayed', 'info')}>View</button></td>
              </tr>
              <tr>
                <td className="font-semibold">Form 940 - FUTA Annual</td>
                <td>Federal Annual</td>
                <td>Jan–Dec 2025</td>
                <td>01/31/2026</td>
                <td><span className="badge badge-green">Filed</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('Form 940 receipt on file', 'info')}>View</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── 4. BENEFITS & DEDUCTIONS ── */}
      {activeTab === 'benefits' && (
        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Benefits &amp; Deduction Types</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Deduction</th>
                <th>Tax Treatment</th>
                <th style={{ textAlign: 'right' }}>Employee Contribution</th>
                <th style={{ textAlign: 'right' }}>Employer Match</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">401(k) Retirement</td>
                <td><span className="badge badge-blue">Pre-Tax</span></td>
                <td style={{ textAlign: 'right' }}>5% of gross</td>
                <td style={{ textAlign: 'right' }}>50% up to 3%</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td className="font-semibold">Medical Insurance (PPO)</td>
                <td><span className="badge badge-blue">Pre-Tax</span></td>
                <td style={{ textAlign: 'right' }}>$186 /pay period</td>
                <td style={{ textAlign: 'right' }}>$412 /pay period</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td className="font-semibold">Dental &amp; Vision</td>
                <td><span className="badge badge-blue">Pre-Tax</span></td>
                <td style={{ textAlign: 'right' }}>$24 /pay period</td>
                <td style={{ textAlign: 'right' }}>$18 /pay period</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td className="font-semibold">HSA Contribution</td>
                <td><span className="badge badge-blue">Pre-Tax</span></td>
                <td style={{ textAlign: 'right' }}>$75 /pay period</td>
                <td style={{ textAlign: 'right' }}>$40 /pay period</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td className="font-semibold">Roth 401(k)</td>
                <td><span className="badge badge-orange">Post-Tax</span></td>
                <td style={{ textAlign: 'right' }}>3% of gross</td>
                <td style={{ textAlign: 'right' }}> - </td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td className="font-semibold">Wage Garnishment</td>
                <td><span className="badge badge-orange">Post-Tax</span></td>
                <td style={{ textAlign: 'right' }}>Per court order</td>
                <td style={{ textAlign: 'right' }}> - </td>
                <td><span className="badge badge-gray">2 employees</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export default PayrollPage;

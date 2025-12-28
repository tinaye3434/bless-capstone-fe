
function Sidebar() {
    return (
        <div className="sidebar" data-background-color="dark">
        <div className="sidebar-logo">
          {/*Logo Header */}
          <div className="logo-header" data-background-color="dark">
            <a href="index.html" className="logo">
              <img
                src="assets/img/kaiadmin/logo_light.svg"
                alt="navbar brand"
                className="navbar-brand"
                height="20"
              />
            </a>
            <div className="nav-toggle">
              <button className="btn btn-toggle toggle-sidebar">
                <i className="gg-menu-right"></i>
              </button>
              <button className="btn btn-toggle sidenav-toggler">
                <i className="gg-menu-left"></i>
              </button>
            </div>
            <button className="topbar-toggler more">
              <i className="gg-more-vertical-alt"></i>
            </button>
          </div>
          {/*End Logo Header */}
        </div>
        <div className="sidebar-wrapper scrollbar scrollbar-inner">
          <div className="sidebar-content">
            <ul className="nav nav-secondary">

              <li className="nav-item">
                <a href="../../documentation/index.html">
                  <i className="fas fa-home"></i>
                  <p>Dashboard</p>
                </a>
              </li>

              <li className="nav-item">
                <a href="../../documentation/index.html">
                  <i className="fas fa-plus"></i>
                  <p>Create Claim</p>
                </a>
              </li>

              <li className="nav-item">
                <a href="../../documentation/index.html">
                  <i className="fas fa-file"></i>
                  <p>My Claims</p>
                </a>
              </li>
              
              <li className="nav-section">
                <span className="sidebar-mini-icon">
                  <i className="fa fa-ellipsis-h"></i>
                </span>
                <h4 className="text-section">Management</h4>
              </li>

              <li className="nav-item">
                <a href="../../documentation/index.html">
                  <i className="fas fa-gavel"></i>
                  <p>Claim Approval</p>
                </a>
              </li>

              <li className="nav-item">
                <a href="../../documentation/index.html">
                  <i className="fas fa-copy"></i>
                  <p>All Claims</p>
                </a>
              </li>
              
              <li className="nav-section">
                <span className="sidebar-mini-icon">
                  <i className="fa fa-ellipsis-h"></i>
                </span>
                <h4 className="text-section">Configurations</h4>
              </li>

              <li className="nav-item">
                <a href="../../documentation/index.html">
                  <i className="fas fa-wrench"></i>
                  <p>Settings</p>
                </a>
              </li>


              
            </ul>
          </div>
        </div>
      </div>
    );
}

export default Sidebar;
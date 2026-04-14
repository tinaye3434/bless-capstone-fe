import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuth, getDisplayName, getInitials, getUser } from '../utils/auth'

function Header() {
  const navigate = useNavigate()
  const user = getUser()
  const initials = getInitials(user)
  const displayName = getDisplayName(user)

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout/')
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      clearAuth()
      delete axios.defaults.headers.common.Authorization
      navigate('/login')
    }
  }

  return (
    <div className='main-header'>
      <div className='main-header-logo'>
        {/* Logo Header */}
        <div className='logo-header' data-background-color='dark'>
          <a href='/' className='logo'>
            <img
              src='/assets/img/kaiadmin/logo_light.svg'
              alt='navbar brand'
              className='navbar-brand'
              height='20'
            />
          </a>
          <div className='nav-toggle'>
            <button className='btn btn-toggle toggle-sidebar'>
              <i className='gg-menu-right'></i>
            </button>
            <button className='btn btn-toggle sidenav-toggler'>
              <i className='gg-menu-left'></i>
            </button>
          </div>
          <button className='topbar-toggler more'>
            <i className='gg-more-vertical-alt'></i>
          </button>
        </div>
        {/* End Logo Header */}
      </div>
      {/* Navbar Header */}
      <nav className='navbar navbar-header navbar-header-transparent navbar-expand-lg border-bottom'>
        <div className='container-fluid'>
          <nav className='navbar navbar-header-left navbar-expand-lg navbar-form nav-search p-3 d-none d-lg-flex'>
            <div className='input-group'>
              <div className='input-group-prepend'>
                <button type='submit' className='btn btn-search pe-1'>
                  <i className='fa fa-search search-icon'></i>
                </button>
              </div>
              <input type='text' placeholder='Search ...' className='form-control' />
            </div>
          </nav>

          <ul className='navbar-nav topbar-nav ms-md-auto align-items-center'>
            <li className='nav-item topbar-icon dropdown hidden-caret d-flex d-lg-none'>
              <a
                className='nav-link dropdown-toggle'
                data-bs-toggle='dropdown'
                href='#'
                role='button'
                aria-expanded='false'
                aria-haspopup='true'
              >
                <i className='fa fa-search'></i>
              </a>
              <ul className='dropdown-menu dropdown-search animated fadeIn'>
                <form className='navbar-left navbar-form nav-search'>
                  <div className='input-group'>
                    <input type='text' placeholder='Search ...' className='form-control' />
                  </div>
                </form>
              </ul>
            </li>

            <li className='nav-item topbar-user dropdown hidden-caret pe-5'>
              <a
                className='dropdown-toggle profile-pic'
                data-bs-toggle='dropdown'
                href='#'
                aria-expanded='false'
              >
                <div className='avatar-sm'>
                  <div className='app-avatar-circle app-avatar-circle-sm'>{initials}</div>
                </div>
                <span className='profile-username'>
                  <span className='op-7'>Hi,</span>
                  <span className='fw-bold'>{displayName}</span>
                </span>
              </a>
              <ul className='dropdown-menu dropdown-user animated fadeIn'>
                <div className='dropdown-user-scroll scrollbar-outer'>
                  <li>
                    <div className='user-box'>
                      <div className='avatar-lg'>
                        <div className='app-avatar-circle app-avatar-circle-lg'>{initials}</div>
                      </div>
                      <div className='u-text'>
                        <h4>{displayName}</h4>
                        <p className='text-muted'>{user?.email || '-'}</p>
                        <Link to='/profile' className='btn btn-xs btn-secondary btn-sm'>
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className='dropdown-divider'></div>
                    <button type='button' className='dropdown-item' onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </div>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
      {/* End Navbar */}
    </div>
  )
}

export default Header

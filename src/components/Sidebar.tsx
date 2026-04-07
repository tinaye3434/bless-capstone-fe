import { NavLink } from 'react-router-dom'
import { isAdmin, isApprover } from '../utils/auth'

function Sidebar() {
  const canManageClaims = isAdmin() || isApprover()
  const showSettings = isAdmin()

  return (
    <div className='sidebar' data-background-color='dark'>
      <div className='sidebar-logo'>
        {/*Logo Header */}
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
        {/*End Logo Header */}
      </div>
      <div className='sidebar-wrapper scrollbar scrollbar-inner'>
        <div className='sidebar-content'>
          <ul className='nav nav-secondary'>
            <li className='nav-item'>
              <NavLink to='/'>
                <i className='fas fa-home'></i>
                <p>Dashboard</p>
              </NavLink>
            </li>

            <li className='nav-item'>
              <NavLink to='/my-claims'>
                <i className='fas fa-file'></i>
                <p>My Claims</p>
              </NavLink>
            </li>
            <li className='nav-item'>
              <NavLink to='/submissions'>
                <i className='fas fa-clipboard-check'></i>
                <p>Submissions</p>
              </NavLink>
            </li>

            <li className='nav-section'>
              <span className='sidebar-mini-icon'>
                <i className='fa fa-ellipsis-h'></i>
              </span>
              <h4 className='text-section'>Management</h4>
            </li>

            {canManageClaims ? (
              <li className='nav-item'>
                <NavLink to='/all-claims'>
                  <i className='fas fa-copy'></i>
                  <p>All Claims</p>
                </NavLink>
              </li>
            ) : null}

            {showSettings ? (
              <li className='nav-item'>
                <NavLink to='/fraud-training'>
                  <i className='fas fa-brain'></i>
                  <p>Fraud Training</p>
                </NavLink>
              </li>
            ) : null}

            <li className='nav-section'>
              <span className='sidebar-mini-icon'>
                <i className='fa fa-ellipsis-h'></i>
              </span>
              <h4 className='text-section'>Configurations</h4>
            </li>

            {showSettings ? (
              <li className='nav-item'>
                <NavLink to='/settings'>
                  <i className='fas fa-wrench'></i>
                  <p>Settings</p>
                </NavLink>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Sidebar

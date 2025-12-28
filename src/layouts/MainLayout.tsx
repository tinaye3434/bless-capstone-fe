import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout() {
    return (

        <div className="wrapper">
      <Sidebar/>

      <div className="main-panel">
        <Header />

        <div className="container">
          <div className="page-inner">
            <Outlet />
          </div>
        </div>

        <Footer />
      </div>

    </div>
        
    );
}

export default MainLayout;
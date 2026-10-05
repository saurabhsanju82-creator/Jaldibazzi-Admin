import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logoutAdmin } from '../../store/slices/authSlice';
import {
  FiGrid,
  FiUsers,
  FiBox,
  FiShoppingBag,
  FiLogOut,
  FiShield,
  FiMenu,
  FiX,
  FiTag,
  FiFolder,
  FiSliders,
  FiCreditCard,
  FiMail,
  FiSettings,
  FiBriefcase,
  FiPackage,
  FiChevronDown,
} from 'react-icons/fi';

export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useSelector((state) => state.auth);
  const { items: vendors } = useSelector((state) => state.vendors || { items: [] });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const pendingApprovalsCount = (vendors || []).filter((v) => v.status === 'PENDING').length;
  const badgeColor = 'bg-amber-500 text-slate-950 font-bold';

  const navItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    {
      id: 'vendors',
      path: '/vendors',
      label: 'Vendors',
      icon: FiBriefcase,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor,
    },
    {
      id: 'manage-products',
      label: 'Manage Products',
      icon: FiPackage,
      children: [
        { id: 'products', path: '/products', label: 'Products', icon: FiBox },
        { id: 'categories', path: '/categories', label: 'Categories', icon: FiFolder },
        { id: 'coupons', path: '/coupons', label: 'Coupons', icon: FiTag },
      ],
    },
    { id: 'orders', path: '/orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'payments', path: '/payments', label: 'Payments', icon: FiCreditCard },
    { id: 'users', path: '/users', label: 'Users', icon: FiUsers },
    { id: 'emails', path: '/emails', label: 'Emails', icon: FiMail },
    { id: 'store-settings', path: '/store-settings', label: 'Store Settings', icon: FiSliders },
    { id: 'settings', path: '/settings', label: 'Settings', icon: FiSettings },
  ];

  const flatItems = navItems.flatMap((n) => n.children || [n]);

  const handleLogout = async () => {
    await dispatch(logoutAdmin());
    navigate('/login');
  };

  const isCurrentActive = (itemPath) => {
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(itemPath);
  };

  const currentNavItem = flatItems.find((n) => isCurrentActive(n.path)) || flatItems[0];

  const renderLink = (item, { child = false, onClick } = {}) => {
    const Icon = item.icon;
    const active = isCurrentActive(item.path);
    return (
      <Link
        key={item.id}
        to={item.path}
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
          child ? 'pl-9' : ''
        } ${
          active
            ? 'bg-slate-800 text-white font-semibold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`text-base ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
        )}
      </Link>
    );
  };

  const renderNav = (onClick) =>
    navItems.map((item) => {
      if (!item.children) return renderLink(item, { onClick });
      const Icon = item.icon;
      const hasActive = item.children.some((c) => isCurrentActive(c.path));
      const open = openGroups[item.id] ?? hasActive;
      return (
        <div key={item.id} className="space-y-1">
          <button
            type="button"
            onClick={() => setOpenGroups({ ...openGroups, [item.id]: !open })}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Icon className={`text-base ${hasActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </div>
            <FiChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && item.children.map((c) => renderLink(c, { child: true, onClick }))}
        </div>
      );
    });

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none h-full">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FiShield className="text-lg" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">Jaldibaazi Admin</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Control Center</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">{renderNav()}</nav>

        {/* User Info & Sign out */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'Admin'}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
              </div>
            )}
            <div className="truncate">
              <div className="text-xs font-medium text-white truncate">{user?.name || 'Super Administrator'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@jaldibaazi.com'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-md hover:bg-slate-800 cursor-pointer"
          >
            <FiLogOut className="text-base" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <FiShield className="text-emerald-400 text-lg" />
          <span className="font-bold text-sm">Jaldibaazi Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 shrink-0 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {renderNav(() => setMobileMenuOpen(false))}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-rose-400 flex items-center gap-1 font-medium cursor-pointer"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full overflow-y-auto">
        {/* Subtle Top Breadcrumb Bar */}
        <header className="h-16 px-6 lg:px-10 border-b border-slate-200/80 bg-white/95 backdrop-blur flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Platform</span>
              <span>/</span>
              {location.pathname.startsWith('/vendors/') && location.pathname !== '/vendors' ? (
                <>
                  <Link to="/vendors" className="hover:text-slate-900 transition">
                    Vendors
                  </Link>
                  <span>/</span>
                  <span className="font-semibold text-slate-900">Vendor Details</span>
                </>
              ) : (
                <span className="font-semibold text-slate-900 capitalize">
                  {currentNavItem?.label || 'Dashboard'}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 lg:p-10 w-full flex-1 pb-12">{children}</div>
      </main>
    </div>
  );
}

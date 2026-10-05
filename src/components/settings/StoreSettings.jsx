import React from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { FiSliders, FiStar, FiTag, FiGrid } from 'react-icons/fi';
import SliderManagement from '../sliders/SliderManagement';
import HomeShowcaseSettings from './HomeShowcaseSettings';

const TABS = [
  { id: 'sliders', label: 'Home Sliders', icon: FiSliders },
  { id: 'featured', label: 'Featured Products', icon: FiStar },
  { id: 'sale', label: 'Products On Sale', icon: FiTag },
  { id: 'categories', label: 'Categories Cards', icon: FiGrid },
];

export default function StoreSettings() {
  const { tab } = useParams();

  if (!TABS.some((t) => t.id === tab)) {
    return <Navigate to="/store-settings/sliders" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
      </div>

      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <NavLink
            key={id}
            to={`/store-settings/${id}`}
            className={({ isActive }) =>
              `pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Icon className="text-sm" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {tab === 'sliders' ? <SliderManagement /> : <HomeShowcaseSettings tab={tab} />}
    </div>
  );
}

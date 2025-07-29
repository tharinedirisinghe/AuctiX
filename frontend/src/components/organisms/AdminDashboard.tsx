import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/hooks';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AxiosRequest from '@/services/axiosInspector';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const userData = useAppSelector((state) => state.user);
  const authData = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const axiosInstance = AxiosRequest().axiosInstance;
  const token = authData?.token;

  return (
    <div className="bg-white">
      <section className="relative w-full mb-5">
        {/* Banner image without padding */}
        <div className="relative h-64 w-full">
          <img
            src={userData.banner_photo}
            alt="cover-image"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div className="flex items-end">
                  <img
                    src={userData.profile_photo}
                    alt="user-avatar-image"
                    className="rounded-md w-20 h-20 object-cover shadow-lg shadow-white/10 border-2 border-white/20"
                  />
                  <div className="flex flex-col items-start ml-4 md:ml-6 mb-2">
                    <div className="text-white/80 font-medium leading-none text-sm">
                      Hello,
                    </div>
                    <h3 className="font-manrope font-bold text-2xl md:text-4xl text-white">
                      {userData.username || 'Admin'}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings/profile')}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

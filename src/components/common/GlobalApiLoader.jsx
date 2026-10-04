import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import NProgress from 'nprogress';

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });

export default function GlobalApiLoader() {
  const isLoading = useSelector((state) => state.loading?.isLoading);

  useEffect(() => {
    if (isLoading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [isLoading]);

  return null;
}


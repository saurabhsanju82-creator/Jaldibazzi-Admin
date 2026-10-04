/**
 * Analyzes image pixel data via HTML5 Canvas and generates a harmonious
 * soft ambient background gradient based on dominant image tones.
 */
export const extractGradientFromImage = (imageSrc) => {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve('linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.7) 100%)');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 40, 40);

        const imgData = ctx.getImageData(0, 0, 40, 40).data;
        let r1 = 0, g1 = 0, b1 = 0, count1 = 0;
        let r2 = 0, g2 = 0, b2 = 0, count2 = 0;

        // Sample top-left region
        for (let y = 0; y < 20; y += 2) {
          for (let x = 0; x < 20; x += 2) {
            const idx = (y * 40 + x) * 4;
            r1 += imgData[idx];
            g1 += imgData[idx + 1];
            b1 += imgData[idx + 2];
            count1++;
          }
        }

        // Sample bottom-right region
        for (let y = 20; y < 40; y += 2) {
          for (let x = 20; x < 40; x += 2) {
            const idx = (y * 40 + x) * 4;
            r2 += imgData[idx];
            g2 += imgData[idx + 1];
            b2 += imgData[idx + 2];
            count2++;
          }
        }

        r1 = Math.round(r1 / (count1 || 1));
        g1 = Math.round(g1 / (count1 || 1));
        b1 = Math.round(b1 / (count1 || 1));

        r2 = Math.round(r2 / (count2 || 1));
        g2 = Math.round(g2 / (count2 || 1));
        b2 = Math.round(b2 / (count2 || 1));

        // Generate ambient soft gradient tailored to image colors
        const gradient = `linear-gradient(135deg, rgba(${r1}, ${g1}, ${b1}, 0.28) 0%, rgba(${r2}, ${g2}, ${b2}, 0.16) 50%, rgba(248, 250, 252, 0.95) 100%)`;
        resolve(gradient);
      } catch {
        resolve('linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.7) 100%)');
      }
    };

    img.onerror = () => {
      resolve('linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.7) 100%)');
    };

    img.src = imageSrc;
  });
};

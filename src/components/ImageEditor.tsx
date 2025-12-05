import { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string, width: number, height: number) => void;
  onClose: () => void;
  isDarkMode?: boolean;
  themeMode?: string;
}

const ImageEditor = ({ imageUrl, onSave, onClose, isDarkMode = false, themeMode = 'default' }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(0.5); // Başlangıç zoom %50
  const [originalImageUrl, setOriginalImageUrl] = useState(imageUrl);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [currentImageWidth, setCurrentImageWidth] = useState<number>(0);
  const [currentImageHeight, setCurrentImageHeight] = useState<number>(0);

  // Görüntüyü CORS sorununu çözmek için fetch ile yükle
  const loadImageWithCORS = async (url: string): Promise<string> => {
    // Eğer base64 veya blob URL ise direkt kullan
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // Proxy seçenekleri
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];

    // Önce direkt fetch dene
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn('Direkt fetch başarısız, proxy deneniyor:', error);
    }

    // Proxy'lerden birini dene
    for (const proxy of proxies) {
      try {
        const response = await fetch(proxy, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      } catch (error) {
        console.warn('Proxy başarısız:', proxy, error);
        continue;
      }
    }

    // Tüm yöntemler başarısız olursa orijinal URL'i kullan (canvas tainted olabilir)
    console.warn('Tüm yöntemler başarısız, orijinal URL kullanılıyor (canvas tainted olabilir)');
    return url;
  };

  useEffect(() => {
    const loadImage = async () => {
      setImageLoaded(false);
      const loadedUrl = await loadImageWithCORS(imageUrl);
      setCurrentImageUrl(loadedUrl);
      setOriginalImageUrl(loadedUrl);
    };
    loadImage();
  }, [imageUrl]);

  // currentImageUrl değiştiğinde görüntüyü yeniden yükle
  useEffect(() => {
    if (currentImageUrl) {
      setImageLoaded(false);
    }
  }, [currentImageUrl]);

  const handleImageLoad = () => {
    console.log('Görüntü yüklendi');
    if (imageRef.current) {
      console.log('Görüntü boyutları:', imageRef.current.width, 'x', imageRef.current.height);
      setCurrentImageWidth(imageRef.current.width);
      setCurrentImageHeight(imageRef.current.height);
    }
    setImageLoaded(true);
  };

  const drawImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas boyutlarını container'a göre ayarla
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Görüntüyü çiz
    const imgWidth = image.width * scale;
    const imgHeight = image.height * scale;
    const x = (canvas.width - imgWidth) / 2;
    const y = (canvas.height - imgHeight) / 2;

    ctx.drawImage(image, x, y, imgWidth, imgHeight);

    // Crop çerçevesini çiz
    if (cropStart && cropEnd) {
      const rectX = Math.min(cropStart.x, cropEnd.x);
      const rectY = Math.min(cropStart.y, cropEnd.y);
      const rectWidth = Math.abs(cropEnd.x - cropStart.x);
      const rectHeight = Math.abs(cropEnd.y - cropStart.y);

      // Görüntü sınırlarını hesapla
      const imgRight = x + imgWidth;
      const imgBottom = y + imgHeight;

      // Crop alanının görüntü ile kesişimini hesapla
      const cropLeft = Math.max(rectX, x);
      const cropTop = Math.max(rectY, y);
      const cropRight = Math.min(rectX + rectWidth, imgRight);
      const cropBottom = Math.min(rectY + rectHeight, imgBottom);

      const actualCropWidth = cropRight - cropLeft;
      const actualCropHeight = cropBottom - cropTop;

      if (actualCropWidth > 0 && actualCropHeight > 0) {
        // Yarı saydam overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Seçili alanı göster (clear)
        ctx.clearRect(cropLeft, cropTop, actualCropWidth, actualCropHeight);
        
        // Seçili alan içindeki görüntüyü yeniden çiz
        const sourceX = (cropLeft - x) / scale;
        const sourceY = (cropTop - y) / scale;
        const sourceWidth = actualCropWidth / scale;
        const sourceHeight = actualCropHeight / scale;
        
        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          cropLeft,
          cropTop,
          actualCropWidth,
          actualCropHeight
        );

        // Çerçeve çiz
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cropLeft, cropTop, actualCropWidth, actualCropHeight);
        ctx.setLineDash([]);

        // Köşe tutamaçları
        const handleSize = 10;
        ctx.fillStyle = '#3b82f6';
        // Sol üst
        ctx.fillRect(cropLeft - handleSize/2, cropTop - handleSize/2, handleSize, handleSize);
        // Sağ üst
        ctx.fillRect(cropLeft + actualCropWidth - handleSize/2, cropTop - handleSize/2, handleSize, handleSize);
        // Sol alt
        ctx.fillRect(cropLeft - handleSize/2, cropTop + actualCropHeight - handleSize/2, handleSize, handleSize);
        // Sağ alt
        ctx.fillRect(cropLeft + actualCropWidth - handleSize/2, cropTop + actualCropHeight - handleSize/2, handleSize, handleSize);
      }
    }
  };

  useEffect(() => {
    if (imageLoaded && imageRef.current && canvasRef.current) {
      // Görüntü yüklendikten sonra canvas'ı çiz
      requestAnimationFrame(() => {
        drawImage();
      });
    }
  }, [scale, cropStart, cropEnd, imageLoaded, currentImageUrl]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isCropping || !cropStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropEnd({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!cropStart || !cropEnd || !imageRef.current || !canvasRef.current) {
      console.log('Crop başlatılamadı:', { cropStart, cropEnd, image: !!imageRef.current, canvas: !!canvasRef.current });
      return;
    }

    const canvas = canvasRef.current;
    const image = imageRef.current;

    // Seçilen dikdörtgenin koordinatlarını hesapla
    const rectX = Math.min(cropStart.x, cropEnd.x);
    const rectY = Math.min(cropStart.y, cropEnd.y);
    const rectWidth = Math.abs(cropEnd.x - cropStart.x);
    const rectHeight = Math.abs(cropEnd.y - cropStart.y);

    if (rectWidth < 10 || rectHeight < 10) {
      alert('Lütfen daha büyük bir alan seçin');
      return;
    }

    // Canvas üzerindeki görüntü boyutlarını ve pozisyonunu hesapla
    const imgDisplayWidth = image.width * scale;
    const imgDisplayHeight = image.height * scale;
    const imgX = (canvas.width - imgDisplayWidth) / 2;
    const imgY = (canvas.height - imgDisplayHeight) / 2;

    // Crop alanının görüntü ile kesişimini hesapla
    const cropLeft = Math.max(rectX, imgX);
    const cropTop = Math.max(rectY, imgY);
    const cropRight = Math.min(rectX + rectWidth, imgX + imgDisplayWidth);
    const cropBottom = Math.min(rectY + rectHeight, imgY + imgDisplayHeight);

    const actualCropWidth = cropRight - cropLeft;
    const actualCropHeight = cropBottom - cropTop;

    if (actualCropWidth <= 0 || actualCropHeight <= 0) {
      alert('Seçilen alan görüntü dışında. Lütfen görüntü üzerinde bir alan seçin.');
      return;
    }

    // Canvas koordinatlarından görüntünün orijinal koordinatlarına çevir
    const sourceX = (cropLeft - imgX) / scale;
    const sourceY = (cropTop - imgY) / scale;
    const sourceWidth = actualCropWidth / scale;
    const sourceHeight = actualCropHeight / scale;

    // Sınırları kontrol et
    const finalSourceX = Math.max(0, Math.min(sourceX, image.width));
    const finalSourceY = Math.max(0, Math.min(sourceY, image.height));
    const maxSourceWidth = image.width - finalSourceX;
    const maxSourceHeight = image.height - finalSourceY;
    const finalSourceWidth = Math.min(sourceWidth, maxSourceWidth);
    const finalSourceHeight = Math.min(sourceHeight, maxSourceHeight);

    if (finalSourceWidth <= 0 || finalSourceHeight <= 0) {
      alert('Seçilen alan geçersiz. Lütfen tekrar deneyin.');
      return;
    }

    console.log('Crop işlemi:', {
      sourceX: finalSourceX,
      sourceY: finalSourceY,
      sourceWidth: finalSourceWidth,
      sourceHeight: finalSourceHeight,
      imageWidth: image.width,
      imageHeight: image.height
    });

    // Yeni canvas oluştur - kırpılmış görüntü için
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = finalSourceWidth;
    cropCanvas.height = finalSourceHeight;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) {
      console.error('Crop canvas context oluşturulamadı');
      return;
    }

    // Kırpılmış görüntüyü çiz
    try {
      cropCtx.drawImage(
        image,
        finalSourceX,
        finalSourceY,
        finalSourceWidth,
        finalSourceHeight,
        0,
        0,
        finalSourceWidth,
        finalSourceHeight
      );

      // Kırpılmış görüntüyü yatayda 1200px'e getirmek için orantılı büyüt
      const targetWidth = 1200;
      const scaleRatio = targetWidth / finalSourceWidth;
      const resizedWidth = targetWidth;
      const resizedHeight = Math.round(finalSourceHeight * scaleRatio);

      console.log('Yeniden boyutlandırma:', {
        orijinal: `${finalSourceWidth}x${finalSourceHeight}`,
        yeni: `${resizedWidth}x${resizedHeight}`,
        oran: scaleRatio.toFixed(2)
      });

      // Yeniden boyutlandırılmış canvas oluştur
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = resizedWidth;
      resizedCanvas.height = resizedHeight;
      const resizedCtx = resizedCanvas.getContext('2d');
      if (!resizedCtx) {
        console.error('Resized canvas context oluşturulamadı');
        return;
      }

      // Kırpılmış görüntüyü yeni boyutlara çiz (yüksek kalite için)
      resizedCtx.imageSmoothingEnabled = true;
      resizedCtx.imageSmoothingQuality = 'high';
      resizedCtx.drawImage(
        cropCanvas,
        0,
        0,
        finalSourceWidth,
        finalSourceHeight,
        0,
        0,
        resizedWidth,
        resizedHeight
      );

      // Base64'e çevir - CORS hatası olabilir, bu durumda blob kullan
      let croppedImageUrl: string;
      try {
        croppedImageUrl = resizedCanvas.toDataURL('image/png', 1.0);
        console.log('Crop ve resize başarılı (toDataURL), yeni görüntü URL uzunluğu:', croppedImageUrl.length);
      } catch (dataUrlError) {
        // CORS hatası varsa, blob kullan
        console.warn('toDataURL başarısız, blob kullanılıyor:', dataUrlError);
        resizedCanvas.toBlob((blob) => {
          if (!blob) {
            alert('Kırpma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const blobUrl = reader.result as string;
            console.log('Crop ve resize başarılı (blob), yeni görüntü URL uzunluğu:', blobUrl.length);
            setCurrentImageUrl(blobUrl);
            setCurrentImageWidth(resizedWidth);
            setCurrentImageHeight(resizedHeight);
            setCropStart(null);
            setCropEnd(null);
            setIsCropping(false);
            setScale(0.5); // Kırpma sonrası %50'ye dön
          };
          reader.onerror = () => {
            console.error('Blob okuma hatası');
            alert('Kırpılmış görüntü okunamadı. Lütfen tekrar deneyin.');
          };
          reader.readAsDataURL(blob);
        }, 'image/png', 1.0);
        return; // Blob işlemi async, buradan çık
      }
      
      // Yeni görüntüyü yükle ve sonra state'i güncelle
      const newImg = new Image();
      newImg.onload = () => {
        console.log('Kırpılmış ve yeniden boyutlandırılmış görüntü yüklendi, boyutlar:', newImg.width, 'x', newImg.height);
        // Görüntü yüklendikten sonra state'i güncelle
        setCurrentImageUrl(croppedImageUrl);
        setCurrentImageWidth(resizedWidth);
        setCurrentImageHeight(resizedHeight);
        setCropStart(null);
        setCropEnd(null);
        setIsCropping(false);
        setScale(0.5); // Kırpma sonrası %50'ye dön
      };
      newImg.onerror = () => {
        console.error('Kırpılmış görüntü yüklenemedi');
        alert('Kırpılmış görüntü yüklenemedi. Lütfen tekrar deneyin.');
      };
      newImg.src = croppedImageUrl;
    } catch (error) {
      console.error('Crop işlemi sırasında hata:', error);
      alert('Kırpma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleReset = () => {
    setCurrentImageUrl(originalImageUrl);
    setCropStart(null);
    setCropEnd(null);
    setIsCropping(false);
    setScale(0.5); // Reset'te de %50'ye dön
  };

  const handleSave = () => {
    onSave(currentImageUrl, currentImageWidth, currentImageHeight);
    onClose();
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          paddingBottom: '1rem'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: isDarkMode ? 'white' : '#111827'
          }}>
            📸 Fotoğraf Düzenle
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          style={{
            width: '800px',
            height: '600px',
            maxWidth: '100%',
            maxHeight: '60vh',
            border: `2px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#f9fafb',
            position: 'relative'
          }}
        >
          <img
            ref={imageRef}
            src={currentImageUrl}
            alt="Edit"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            onError={(e) => {
              console.error('Görüntü yüklenemedi:', e);
              // CORS hatası olabilir, crossOrigin'i kaldırıp tekrar dene
              if (imageRef.current && !imageRef.current.crossOrigin) {
                imageRef.current.crossOrigin = '';
                imageRef.current.src = currentImageUrl;
              } else {
                setImageLoaded(false);
              }
            }}
            style={{ display: 'none' }}
            key={currentImageUrl} // currentImageUrl değiştiğinde görüntüyü yeniden yükle
          />
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: '100%',
              height: '100%',
              cursor: isCropping ? 'crosshair' : 'default'
            }}
          />
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          paddingTop: '1rem'
        }}>
          {/* Zoom Controls */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            borderRadius: '8px'
          }}>
            <button
              onClick={handleZoomOut}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              ➖ Küçült
            </button>
            <span style={{
              color: isDarkMode ? 'white' : '#111827',
              fontSize: '0.875rem',
              fontWeight: '600',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              ➕ Büyüt
            </button>
          </div>

          {/* Crop Button */}
          <button
            onClick={() => {
              setIsCropping(!isCropping);
              if (isCropping) {
                setCropStart(null);
                setCropEnd(null);
              }
            }}
            style={{
              backgroundColor: isCropping ? '#059669' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isCropping ? '#047857' : '#4b5563';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isCropping ? '#059669' : '#6b7280';
            }}
          >
            ✂️ {isCropping ? 'Kırpmayı İptal' : 'Kırp'}
          </button>

          {/* Apply Crop */}
          {isCropping && cropStart && cropEnd && (
            <button
              onClick={handleCrop}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              ✓ Kırpmayı Uygula
            </button>
          )}

          {/* Reset Button */}
          <button
            onClick={handleReset}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
          >
            🔄 Sıfırla
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              marginLeft: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            💾 Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;


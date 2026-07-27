'use client';

import React, { useEffect, useState, useRef } from 'react';
import { socketService } from '../../lib/socket';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../hooks/useAuth';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface LiveBidConsoleProps {
  auctionId: string;
  currentPrice: number;
  bidIncrement: number;
  endsAt: string;
}

export function LiveBidConsole({ auctionId, currentPrice, bidIncrement, endsAt }: LiveBidConsoleProps) {
  const { token, user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [latestPrice, setLatestPrice] = useState<number>(currentPrice);
  const [bidAmount, setBidAmount] = useState<number>(currentPrice + bidIncrement);
  const [maxAmount, setMaxAmount] = useState<number>(currentPrice + bidIncrement * 2);
  const [isAutoBid, setIsAutoBid] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [auctionEnded, setAuctionEnded] = useState<boolean>(false);
  const [latestEndsAt, setLatestEndsAt] = useState<string>(endsAt);
  const [isPlacingBid, setIsPlacingBid] = useState<boolean>(false);
  
  const bidsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bidsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bids]);

  useEffect(() => {
    const socket = socketService.connect('/notifications', token || undefined);
    
    socket.emit('join:auction', { auctionId });

    socket.on('bid:placed', (data: { auctionId: string, bid: Bid, currentPrice: number, endsAt: string }) => {
      if (data.auctionId === auctionId) {
        setLatestPrice(data.currentPrice);
        setBidAmount(data.currentPrice + bidIncrement);
        setLatestEndsAt(data.endsAt);
        setBids((prev) => [...prev, data.bid]);
      }
    });

    socket.on('auction:extended', (data: { auctionId: string, newEndsAt: string }) => {
      if (data.auctionId === auctionId) {
        setLatestEndsAt(data.newEndsAt);
      }
    });

    socket.on('auction:ended', (data: { auctionId: string }) => {
      if (data.auctionId === auctionId) {
        setAuctionEnded(true);
      }
    });

    return () => {
      socket.emit('leave:auction', { auctionId });
      socket.off('bid:placed');
      socket.off('auction:extended');
      socket.off('auction:ended');
    };
  }, [auctionId, token, bidIncrement]);

  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(latestEndsAt).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('Bitti');
        setAuctionEnded(true);
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${h}sa ${m}dk ${s}sn`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [latestEndsAt]);

  const handlePlaceBid = async () => {
    if (!token || !user) {
      alert('Teklif verebilmek için lütfen giriş yapın.');
      return;
    }
    
    if (bidAmount <= latestPrice) {
      alert(`Teklifiniz ${latestPrice} değerinden büyük olmalıdır.`);
      return;
    }

    try {
      setIsPlacingBid(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/bids/${auctionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: bidAmount,
          maxAmount: isAutoBid ? maxAmount : undefined,
          isAutoBid
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Teklif verilemedi');
      }
    } catch (err) {
      console.error(err);
      alert('Teklif verirken bir hata oluştu');
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 flex flex-col h-[500px] border border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm text-slate-400 font-medium">Güncel Fiyat</h3>
          <p className="text-3xl font-bold text-green-400">${latestPrice.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm text-slate-400 font-medium">Kalan Süre</h3>
          <p className={`text-xl font-bold ${auctionEnded ? 'text-red-500' : 'text-amber-400'}`}>
            {timeLeft}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 bg-slate-800/50 rounded-lg p-4 space-y-3">
        {bids.length === 0 ? (
          <p className="text-slate-500 text-center text-sm py-4">Henüz teklif yok — ilk teklifi siz verin!</p>
        ) : (
          bids.map((b) => (
            <div key={b.id} className={`p-3 rounded border ${b.userId === user?.id ? 'bg-blue-900/30 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-300">
                  {b.user ? `${b.user.firstName} ${b.user.lastName}` : 'Anonim'}
                  {b.userId === user?.id && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Siz</span>}
                </span>
                <span className="text-slate-400">
                  {new Date(b.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="font-bold text-green-400 mt-1">${b.amount.toLocaleString()}</p>
            </div>
          ))
        )}
        <div ref={bidsEndRef} />
      </div>

      {!auctionEnded && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <input 
              type="checkbox" 
              id="autoBid" 
              checked={isAutoBid} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsAutoBid(e.target.checked)}
              className="rounded border-slate-700 text-blue-500 focus:ring-blue-500 bg-slate-800"
            />
            <label htmlFor="autoBid" className="text-sm text-slate-300 cursor-pointer">Otomatik Teklif</label>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-medium">$</span>
              <Input 
                type="number" 
                value={bidAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBidAmount(Number(e.target.value))}
                className="pl-8 bg-slate-800 border-slate-700 text-white"
                min={latestPrice + bidIncrement}
                step={bidIncrement}
              />
            </div>
            {isAutoBid && (
              <div className="flex-1 relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">Maks $</span>
                <Input 
                  type="number" 
                  value={maxAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxAmount(Number(e.target.value))}
                  className="pl-16 bg-slate-800 border-slate-700 text-white"
                  min={bidAmount + bidIncrement}
                />
              </div>
            )}
            <Button 
              onClick={handlePlaceBid} 
              disabled={isPlacingBid || auctionEnded}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
            >
              {isPlacingBid ? '...' : 'Teklif Ver'}
            </Button>
          </div>
          <p className="text-xs text-slate-500">Minimum teklif artışı: ${bidIncrement}</p>
        </div>
      )}
    </div>
  );
}

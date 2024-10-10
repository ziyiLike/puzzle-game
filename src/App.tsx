import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { Button, Card, List, Statistic } from 'antd';
import { reverseArrayNum, useKeyboardClick } from './utils/hooks';

const getRecordMap = () => {
  const recordMap = localStorage.getItem('maxRecordMap');
  return recordMap ? JSON.parse(recordMap) : { Easy: 0, Mid: 0, Hard: 0 };
};

const App = () => {
  const levelMap = { Easy: 9, Mid: 16, Hard: 25 };
  const sliderWidthMap = { Easy: 100, Mid: 80, Hard: 60 };
  const [start, setStart] = useState(false);
  const [win, setWin] = useState(false);
  const [time, setTime] = useState(0);
  const [level, setLevel] = useState<keyof typeof levelMap>('Easy');
  const [activeArray, setActiveArray] = useState<any[]>([]);
  const [timer, setTimer] = useState<NodeJS.Timer>();
  const [animation, setAnimation] = useState(false);
  const [maxRecordMap, setMaxRecordMap] = useState<Record<string, any>>(getRecordMap);

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const setRandomNumberList = () => {
    const layer = Math.sqrt(levelMap[level]);
    const newArray = shuffleArray(Array.from({ length: levelMap[level] }, (_, index) => (index + 1 === levelMap[level] ? 0 : index + 1)));
    const currentIndex = newArray.findIndex((item) => item === 0);
    const reverseAddNum = layer % 2 === 0 ? Math.floor(currentIndex / layer) + 1 : 0;
    if ((reverseArrayNum(newArray.filter((it) => it)) + reverseAddNum) % 2 !== 0) {
      swapIndex(
        levelMap[level] - 3,
        levelMap[level] - 2,
        newArray.filter((it) => it),
        currentIndex
      );
    } else {
      setActiveArray(newArray);
    }
  };

  const swapIndex = (idx1: number, idx2: number, arr?: any[], currentIndex?: number) => {
    const swapArr = arr || activeArray;
    const temp = swapArr[idx1];
    const newArray = [...swapArr];
    newArray[idx1] = newArray[idx2];
    newArray[idx2] = temp;
    if (arr) {
      newArray.splice(currentIndex!, 0, 0);
    }
    setActiveArray(newArray);
    !arr && gameStart();
  };

  const gameStart = () => {
    if (!start) {
      setStart(true);
      setTimer(
        setInterval(() => {
          setTime((prev) => Number((prev + 0.01).toFixed(2)));
        }, 10)
      );
    }
  };

  const handleSliderClick = (item: number | '') => {
    const clickIndex = activeArray.findIndex((i) => item === i);
    const currentIndex = activeArray.findIndex((i) => i === 0);
    const layer = Math.sqrt(levelMap[level]);
    const movement = clickIndex - currentIndex;
    if (Math.abs(movement) === 1 || Math.abs(movement) === layer) {
      if (movement === 1) {
        swiperTo('left');
      }
      if (movement === -1) {
        swiperTo('right');
      }
      if (movement === layer) {
        swiperTo('up');
      }
      if (movement === -layer) {
        swiperTo('down');
      }
    }
  };

  const handleResetClick = () => {
    setWin(false);
    setStart(false);
    timer && clearInterval(timer as any);
    setTimer(undefined);
    setTime(0);
    setRandomNumberList();
  };

  const swiperTo = (derection: 'left' | 'right' | 'up' | 'down') => {
    const currentIndex = activeArray.findIndex((item) => item === 0);
    const layer = Math.sqrt(levelMap[level]);
    const moveWidth = sliderWidthMap[level];
    if (!animation) {
      if (derection === 'left' && (currentIndex + 1) % layer !== 0) {
        setAnimation(true);
        gsap.to(`.item-${activeArray[currentIndex + 1]}`, {
          x: -moveWidth,
          y: 0,
          duration: 0.1,
          onComplete: () => {
            swapIndex(currentIndex, currentIndex + 1 === levelMap[level] ? 0 : currentIndex + 1);
          },
        });
      }
      if (derection === 'right' && (currentIndex % layer !== 0 || currentIndex === 0)) {
        setAnimation(true);
        gsap.to(`.item-${activeArray[currentIndex - 1]}`, {
          x: moveWidth,
          y: 0,
          duration: 0.1,
          onComplete: () => {
            swapIndex(currentIndex, currentIndex - 1 === -1 ? levelMap[level] - 1 : currentIndex - 1);
          },
        });
      }
      if (derection === 'up' && currentIndex < levelMap[level] - layer) {
        setAnimation(true);
        gsap.to(`.item-${activeArray[currentIndex + layer]}`, {
          x: 0,
          y: -moveWidth,
          duration: 0.1,
          onComplete: () => {
            swapIndex(currentIndex, currentIndex + layer);
          },
        });
      }
      if (derection === 'down' && currentIndex > layer - 1) {
        setAnimation(true);
        gsap.to(`.item-${activeArray[currentIndex - layer]}`, {
          x: 0,
          y: moveWidth,
          duration: 0.1,
          onComplete: () => {
            swapIndex(currentIndex, currentIndex - layer);
          },
        });
      }
    }
  };

  useEffect(() => {
    if (reverseArrayNum(activeArray.filter((it) => it)) === 0 && activeArray.at(-1) === 0) {
      timer && clearInterval(timer as any);
      setTimer(undefined);
      setStart(false);
      setWin(true);
      if (time < maxRecordMap[level] || maxRecordMap[level] === 0) {
        const tempMaxRecordMap = {
          ...maxRecordMap,
          [level]: time,
        };
        localStorage.setItem('maxRecordMap', JSON.stringify(tempMaxRecordMap));
        setMaxRecordMap(tempMaxRecordMap);
      }
    }
  }, [activeArray]);

  useEffect(() => {
    setTime(0);
    setWin(false);
    setRandomNumberList();
  }, [level]);

  useEffect(() => {
    gsap.set([`.item-0`], { clearProps: 'x,y' });
    setAnimation(false);
  }, [activeArray]);

  const handleKeyboardListener = (event: KeyboardEvent) => {
    const key = event.key;
    swiperTo(key.toLowerCase().slice(5, key.length) as any);
  };

  useKeyboardClick(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], handleKeyboardListener);

  return (
    <div className="w-[100vw] flex items-center flex-col mt-20 select-none">
      <Statistic title="Move Slider To Start" value={time} />
      <div style={{ gridTemplateColumns: `repeat(${Math.sqrt(levelMap[level])}, minmax(0, 1fr))` }} className={['grid', 'mt-[20px]', 'border-gray-200', 'gap-[4px]', 'border-solid', 'border-4', 'relative'].join(' ')}>
        {activeArray.map((item, index) => (
          <div key={index} style={{ background: item && '#f3f3f3', width: sliderWidthMap[level] + 'px', height: sliderWidthMap[level] + 'px' }} className={`flex items-center justify-center item-${item}`} onClick={() => handleSliderClick(item)}>
            {item || ''}
          </div>
        ))}
        {win && (
          <div className="absolute left-0 right-0 w-full h-full bg-gray-300 bg-opacity-70 flex items-center justify-center flex-col font-bold">
            <div>You Win !</div>
            <div className="mt-5">Final Score: {time}</div>
          </div>
        )}
      </div>
      <div className="mt-20 flex justify-between w-[300px]">
        <Button onClick={handleResetClick}>Reset</Button>
        {Object.keys(levelMap).map((item, index) => (
          <Button type="primary" key={index} onClick={() => setLevel(item as keyof typeof levelMap)}>
            {item}
          </Button>
        ))}
      </div>
      <span className="mt-10 text-gray-500 font-bold">Best Record</span>
      <List
        className="w-full mt-5 px-[40px]"
        grid={{
          gutter: 20,
          xs: 3,
          sm: 2,
          md: 4,
          lg: 4,
          xl: 6,
          xxl: 3,
        }}
        dataSource={Object.entries(maxRecordMap).map(([key, value]) => ({ title: key, value }))}
        renderItem={(item) => (
          <List.Item>
            <Card title={item.title}>{item.value}</Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default App;

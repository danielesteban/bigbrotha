import Level1 from './level1';
import Level2 from './level2';

export default [
  {
    path: '/(level1)?',
    scene: Level1,
  },
  {
    path: '/level2',
    scene: Level2,
  },
];

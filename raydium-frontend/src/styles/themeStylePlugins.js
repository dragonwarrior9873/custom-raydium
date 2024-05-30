const plugin = require('tailwindcss/plugin')

exports.cyberpunkLightBorders = plugin(({ addUtilities }) => {
  const cyberpunkLightBorders = {
    '.cyberpunk-border': {
      position: 'relative',
      '&::after': {
        content: "''",
        position: 'absolute',
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
        borderRadius: 'inherit',
        border: '2px solid transparent',
        background: 'linear-gradient(246deg, #da2eef 7.97%, #2b6aff 49.17%, #39d0d8 92.1%) border-box',
        '-webkit-mask': 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        '-webkit-mask-composite': 'destination-out',
        'mask-composite': 'exclude'
      }
    }
  }
  addUtilities(cyberpunkLightBorders, ['focus-within', 'hover', 'active'])
})

exports.cyberpunkBgLight = plugin(({ addUtilities }) => {
  addUtilities(
    {
      '.cyberpunk-bg-light': {
        position: 'relative',
        '&::before': {
          content: "''",
          position: 'absolute',
          top: '15px',
          bottom: '15px',
          left: '15px',
          zIndex: '-1', // !!! is't parent node must have a new stacking context (like css isolation)
          pointerEvents: 'none',
          width: '60%',
          borderRadius: '50%',
          backgroundColor: '#39d0d8',
          opacity: '.45',
          boxShadow: '0px 0px 140px 55px #39d0d8aa',
          mixBlendMode: 'hard-light'
        },
        '&::after': {
          content: "''",
          position: 'absolute',
          top: '15px',
          bottom: '15px',
          right: '15px',
          zIndex: '-1', // !!! is't parent node must have a new stacking context (like css isolation)
          pointerEvents: 'none',
          width: '60%',
          borderRadius: '50%',
          backgroundColor: '#e300ff',
          opacity: '.45',
          boxShadow: '0px 0px 140px 55px #e300ffaa',
          mixBlendMode: 'hard-light'
        }
      },
      '.cyberpunk-bg-light-acceleraytor': {
        position: 'relative',
        '&::before': {
          content: "''",
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '442px',
          height: '442px',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
          zIndex: '-1',
          pointerEvents: 'none',
          background:
            'linear-gradient(221.5deg, #DA2EEF 16.15%, rgba(218, 46, 239, 0) 84.46%), radial-gradient(53.22% 53.22% at 93.67% 75.22%, rgba(218, 46, 239, 0.5) 0%, rgba(57, 208, 216, 0.5) 55.21%, rgba(84, 44, 238, 0.5) 100%), radial-gradient(63.44% 63.44% at 42.78% 105%, #39D0D8 0%, #542CEE 100%)',
          backgroundBlendMode: 'lighten, color-burn, normal',
          filter: 'blur(132px)',
          opacity: '.45'
        }
      },
      '.cyberpunk-bg-light-acceleraytor-detail-page': {
        position: 'sticky',
        '&::before': {
          content: "''",
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '620px',
          height: '620px',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
          zIndex: '-1',
          pointerEvents: 'none',
          background:
            'linear-gradient(221.5deg, #DA2EEF 16.15%, rgba(218, 46, 239, 0) 84.46%), radial-gradient(53.22% 53.22% at 93.67% 75.22%, rgba(218, 46, 239, 0.5) 0%, rgba(57, 208, 216, 0.5) 55.21%, rgba(84, 44, 238, 0.5) 100%), radial-gradient(63.44% 63.44% at 42.78% 105%, #39D0D8 0%, #542CEE 100%)',
          backgroundBlendMode: 'lighten, color-burn, normal',
          filter: 'blur(132px)',
          opacity: '.15'
        }
      },
      '.cyberpunk-bg-acceleraytor-prject-step-1, .cyberpunk-bg-acceleraytor-prject-step-2, .cyberpunk-bg-acceleraytor-prject-step-3':
        {
          position: 'relative',
          contain: 'paint',
          '&::before': {
            content: "''",
            position: 'absolute',
            top: '130%',
            left: '90%',
            width: '346px',
            height: '346px',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            background:
              'linear-gradient(221.5deg, #DA2EEF 16.15%, rgba(218, 46, 239, 0) 84.46%), radial-gradient(53.22% 53.22% at 93.67% 75.22%, rgba(218, 46, 239, 0.5) 0%, rgba(57, 208, 216, 0.5) 55.21%, rgba(84, 44, 238, 0.5) 100%), radial-gradient(63.44% 63.44% at 42.78% 105%, #39D0D8 0%, #542CEE 100%)',
            backgroundBlendMode: 'lighten, color-burn, normal',
            willChange: 'transform',
            filter: 'blur(133px)',
            opacity: '.25'
          }
        },
      '.cyberpunk-bg-acceleraytor-prject-step-2': {
        '&::before': {
          with: '282px',
          height: '282px',
          top: '-19%',
          left: '53%'
        }
      },
      '.cyberpunk-bg-acceleraytor-prject-step-3': {
        '&::before': {
          top: '36%',
          left: '95%'
        }
      }
    },
    ['hover', 'active']
  )
})

exports.glassStyle = plugin(({ addUtilities }) => {
  addUtilities({
    '.frosted-glass-smoke , .frosted-glass-lightsmoke , .frosted-glass-teal , .frosted-glass-skygray , .frosted-glass':
      {
        '--text-color': 'hsl(0, 0%, 100%)',
        '--border-color': 'hsl(0, 0%, 100%)',
        '--bg-board-color': 'hsl(0, 0%, 100%, 0.12)',
        '--bg-board-color-2': 'hsl(0, 0%, 100%, 0)',

        position: 'relative',

        color: 'var(--text-color)',
        background:
          'linear-gradient(162deg, var(--bg-board-color) 28.7%, var(--bg-board-color-2, var(--bg-board-color)))',
        isolation: 'isolate',
        '&::before': {
          content: "''",
          position: 'absolute',
          inset: 0,
          zIndex: '-1',
          opacity: '0.7',
          background: 'transparent',
          borderRadius: 'inherit',
          boxShadow: 'inset 0 0 0 var(--border-line-width, 1.5px) var(--border-color)',
          maskImage: `radial-gradient(at -31% -58%, hsl(0, 0%, 0%, 0.5) 34%, transparent 60%),
        linear-gradient(to left, hsl(0, 0%, 0%, 0.2) 0%, transparent 13%),
        linear-gradient(hsl(0deg 0% 0% / 5%), hsl(0deg 0% 0% / 5%))`
        }
      },
    '.frosted-glass-teal': {
      '--text-color': 'hsl(183, 67%, 54%)',
      '--border-color': 'hsl(165, 87%, 65%)',
      '--bg-board-color': 'hsl(183, 67%, 54%, 0.2)',
      '--bg-board-color-2': 'hsl(183, 67%, 54%, 0)'
    },
    '.frosted-glass-teal.ghost': {
      '--text-color': 'hsl(183, 67%, 54%)',
      '--border-color': 'hsl(165, 87%, 65%, 0.5)',
      '--bg-board-color': 'hsl(183, 67%, 54%, 0.05)',
      '--bg-board-color-2': 'hsl(183, 67%, 54%, 0)'
    },
    '.frosted-glass-skygray': {
      '--text-color': '#ABC4FF',
      '--border-color': '#ABC4FF',
      '--bg-board-color': 'rgba(171, 196, 255, 0.2)',
      '--bg-board-color-2': 'rgba(171, 196, 255, 0)'
    },
    '.frosted-glass-lightsmoke': {
      '--border-color': 'hsl(0, 0%, 100%)',
      '--bg-board-color': 'hsl(0, 0%, 100%, 0.08)',
      '--bg-board-color-2': 'hsl(0, 0%, 100%, 0)',
      '--text-color': 'hsl(0, 0%, 100%)'
    },
    '.frosted-glass-smoke': {
      '--border-color': 'hsl(0, 0%, 100%)',
      '--bg-board-color': 'hsl(0, 0%, 100%, 0.12)',
      '--text-color': 'hsl(0, 0%, 100%)'
    },
    '.forsted-blur-lg': {
      '--blur-size': '6px',
      backdropFilter: 'blur(calc(var(--blur-size) * (-1 * var(--is-scrolling, 0) + 1)))'
    },
    '.forsted-blur': {
      '--blur-size': '3px',
      backdropFilter: 'blur(calc(var(--blur-size) * (-1 * var(--is-scrolling, 0) + 1)))'
    },
    '.forsted-blur-sm': {
      '--blur-size': '2px',
      backdropFilter: 'blur(calc(var(--blur-size) * (-1 * var(--is-scrolling, 0) + 1)))'
    },
    '.frosted-blur-none': {
      '--blur-size': '0'
    }
  })

  addUtilities({
    '.home-rainbow-button-bg': {
      borderRadius: '12px',
      background: 'linear-gradient(245.22deg, #da2eef 35%, #2b6aff 65.17%, #39d0d8 92.1%)',
      backgroundPosition: '30% 50%',
      backgroundSize: '150% 150%',
      transition: '500ms',
      '&:hover': {
        backgroundPosition: '99% 50%'
      }
    }
  })
})

// TODO
// exports.coinRotateLoop = plugin(({ addUtilities }) => {
//   addUtilities({
//     '.swap-coin': {
//       position: 'relative',
//       animation: 'rotate-y-infinite 2s infinite',
//       animationDelay: 'var(--delay, 0)',
//       transformStyle: 'preserve-3d',
//       '.line-group': {
//         position: 'absolute',
//         top: '0',
//         right: '0',
//         bottom: '0',
//         left: '0',
//         transformStyle: 'inherit',
//         '.line-out': {
//           top: '50%',
//           position: 'absolute',
//           left: '50%',
//           width: '50%',
//           transformOrigin: 'left',
//           transformStyle: 'inherit'
//         },
//         '.line-inner': {
//           position: 'absolute',
//           left: '100%',
//           backgroundColor: 'var(--ground-color-dark-solid)',
//           transform: 'translateY(-50%) translateX(-64%) rotateY(90deg)',
//           width: '6px',
//           height: '13px',
//           border: '1px solid rgba(255, 255, 255, 0.5)',
//           borderLeft: 'none',
//           borderRight: 'none'
//         }

//       }
//     }
//   })
// })

/**
 * Button Examples - Demonstrates all button variants
 * This file shows how to use the different button styles
 */
import React from 'react';
import { Button } from './Button';
import { logger } from '@/utils/logger';

export const ButtonExamples: React.FC = () => {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2>Button Examples</h2>
      
      {/* Split Button */}
      <div>
        <h3>Split Button</h3>
        <Button
          variant="split"
          splitLeft="JOIN NOW"
          splitRight="CANCEL"
          onSplitLeftClick={() => logger.log('Join clicked')}
          onSplitRightClick={() => logger.log('Cancel clicked')}
        />
      </div>

      {/* Speech Bubble Button */}
      <div>
        <h3>Speech Bubble Button</h3>
        <Button
          variant="bubble"
          hasTail={true}
          tailPosition="bottom"
        >
          CLICK HERE
        </Button>
      </div>

      {/* Button with Icon */}
      <div>
        <h3>Button with Icon</h3>
        <Button
          variant="primary"
          icon={<span>✉</span>}
          iconPosition="right"
        >
          SEND E-MAIL
        </Button>
      </div>

      {/* Button with Separator and Icon */}
      <div>
        <h3>Button with Separator</h3>
        <Button
          variant="primary"
          hasSeparator={true}
          separatorIcon={<span>✉</span>}
        >
          SEND E-MAIL
        </Button>
      </div>

      {/* Double Outline Button */}
      <div>
        <h3>Double Outline Button</h3>
        <Button
          variant="double-outline"
          icon={<span>▶</span>}
          iconPosition="right"
        >
          MORE
        </Button>
      </div>

      {/* Exit Button */}
      <div>
        <h3>Exit Button</h3>
        <Button
          variant="double-outline"
          icon={<span>✕</span>}
          iconPosition="right"
        >
          EXIT
        </Button>
      </div>

      {/* Regular Buttons */}
      <div>
        <h3>Regular Buttons</h3>
        <Button variant="primary">PRIMARY</Button>
        <Button variant="secondary">SECONDARY</Button>
        <Button variant="outline">OUTLINE</Button>
      </div>
    </div>
  );
};


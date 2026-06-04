import { GithubOutlined } from '@ant-design/icons';
import { Card, Space, Tag, Typography } from 'antd';
import type { GithubPrInfo } from '../../types/review';
import './style.css';

const { Text } = Typography;

interface PrSummaryCardProps {
  prInfo: GithubPrInfo | null;
}

export function PrSummaryCard({ prInfo }: PrSummaryCardProps) {
  if (!prInfo) {
    return null;
  }

  return (
    <Card size="small" className="pr-summary-card">
      <Space direction="vertical" size={8}>
        <Space wrap>
          <GithubOutlined />
          <Text strong>已识别 GitHub PR 信息</Text>
          <Tag color="blue">#{prInfo.pullNumber}</Tag>
        </Space>

        <div className="pr-summary-card__grid">
          <div>
            <Text type="secondary">Owner</Text>
            <Text code>{prInfo.owner}</Text>
          </div>

          <div>
            <Text type="secondary">Repository</Text>
            <Text code>{prInfo.repo}</Text>
          </div>

          <div>
            <Text type="secondary">Pull Request</Text>
            <Text code>#{prInfo.pullNumber}</Text>
          </div>
        </div>
      </Space>
    </Card>
  );
}
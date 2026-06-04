import { Alert, Card, Empty, List, Skeleton, Space, Tag, Typography } from 'antd';
import type { ReviewResult as ReviewResultType, ReviewRiskLevel } from '../../types/review';
import './style.css';

const { Title, Paragraph, Text } = Typography;

interface ReviewResultProps {
  loading?: boolean;
  error?: string | null;
  result: ReviewResultType | null;
}

const riskLevelMap: Record<
  ReviewRiskLevel,
  {
    label: string;
    color: string;
  }
> = {
  low: {
    label: '低风险',
    color: 'green',
  },
  medium: {
    label: '中风险',
    color: 'orange',
  },
  high: {
    label: '高风险',
    color: 'red',
  },
};

function formatTime(time: string) {
  return new Date(time).toLocaleString();
}

export function ReviewResult({ loading = false, error = null, result }: ReviewResultProps) {
  if (loading) {
    return (
      <Card className="review-result-card" title="Review 结果">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="review-result-card" title="Review 结果">
        <Alert
          className="review-result-card__error"
          type="error"
          showIcon
          message="分析失败"
          description={error}
        />

        <Empty description="本次没有生成 Review 结果，请检查输入内容或稍后重试" />
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="review-result-card" title="Review 结果">
        <Empty description="暂无分析结果，请先输入 PR 链接或 diff 文本并点击开始分析" />
      </Card>
    );
  }

  return (
    <Card className="review-result-card" title="Review 结果">
      <Space direction="vertical" size="large" className="review-result-card__content">
        <section>
          <Title level={4}>变更摘要</Title>
          <Paragraph className="review-result-card__paragraph">{result.summary}</Paragraph>
        </section>

        <section>
          <Title level={4}>风险点识别</Title>

          {result.risks.length > 0 ? (
            <List
              className="review-result-card__list"
              dataSource={result.risks}
              renderItem={(risk) => {
                const levelConfig = riskLevelMap[risk.level];

                return (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space wrap>
                          <Tag color={levelConfig.color}>{levelConfig.label}</Tag>
                          <Text strong>{risk.title}</Text>
                        </Space>
                      }
                      description={risk.description}
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Alert type="success" showIcon message="暂未发现明显风险" />
          )}
        </section>

        <section>
          <Title level={4}>优化建议</Title>

          {result.suggestions.length > 0 ? (
            <List
              bordered
              dataSource={result.suggestions}
              renderItem={(suggestion, index) => (
                <List.Item>
                  <Text strong>{index + 1}. </Text>
                  <Text>{suggestion}</Text>
                </List.Item>
              )}
            />
          ) : (
            <Alert type="info" showIcon message="暂无额外优化建议" />
          )}
        </section>

        <section>
          <Title level={4}>合并建议</Title>
          <Alert type="warning" showIcon message={result.mergeAdvice} />
        </section>

        <section className="review-result-card__footer">
          <Text type="secondary">生成时间：{formatTime(result.generatedAt)}</Text>
        </section>
      </Space>
    </Card>
  );
}
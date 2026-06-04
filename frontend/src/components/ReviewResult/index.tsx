import { CopyOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, List, Skeleton, Space, Tag, Typography, message } from 'antd';
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

function getRiskCount(result: ReviewResultType, level: ReviewRiskLevel) {
  return result.risks.filter((risk) => risk.level === level).length;
}

function buildReviewText(result: ReviewResultType) {
  const risksText = result.risks
    .map((risk, index) => {
      const levelLabel = riskLevelMap[risk.level].label;
      return `${index + 1}. 【${levelLabel}】${risk.title}\n${risk.description}`;
    })
    .join('\n\n');

  const suggestionsText = result.suggestions
    .map((suggestion, index) => `${index + 1}. ${suggestion}`)
    .join('\n');

  return `# CodeMentor AI Review 结果

## 变更摘要
${result.summary}

## 风险点识别
${risksText || '暂未发现明显风险'}

## 优化建议
${suggestionsText || '暂无额外优化建议'}

## 合并建议
${result.mergeAdvice}

## 生成时间
${formatTime(result.generatedAt)}
`;
}

async function copyReviewText(result: ReviewResultType) {
  const text = buildReviewText(result);

  try {
    await navigator.clipboard.writeText(text);
    message.success('Review 结果已复制');
  } catch {
    message.error('复制失败，请手动复制 Review 内容');
  }
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
    <Card
      className="review-result-card"
      title="Review 结果"
      extra={
        <Button icon={<CopyOutlined />} onClick={() => copyReviewText(result)}>
          复制结果
        </Button>
      }
    >
      <Space direction="vertical" size="large" className="review-result-card__content">
        <section className="review-result-card__overview">
          <Space wrap>
            <Tag color="red">高风险 {getRiskCount(result, 'high')}</Tag>
            <Tag color="orange">中风险 {getRiskCount(result, 'medium')}</Tag>
            <Tag color="green">低风险 {getRiskCount(result, 'low')}</Tag>
            <Tag color="blue">优化建议 {result.suggestions.length}</Tag>
          </Space>
        </section>

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
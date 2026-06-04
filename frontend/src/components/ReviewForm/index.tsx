import { Button, Card, Form, Input, Radio, Space, Switch, Typography } from 'antd';
import type { ReviewFormValues, ReviewInputType } from '../../types/review';
import './style.css';

const { Paragraph, Text } = Typography;

const DEFAULT_INPUT_TYPE: ReviewInputType = 'prUrl';

interface ReviewFormProps {
  loading?: boolean;
  onSubmit: (values: ReviewFormValues) => void;
}

export function ReviewForm({ loading = false, onSubmit }: ReviewFormProps) {
  const [form] = Form.useForm<ReviewFormValues>();

  const inputType = Form.useWatch('inputType', form) ?? DEFAULT_INPUT_TYPE;

  const handleFinish = (values: ReviewFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="review-form-card" title="开始一次 PR Review">
      <Paragraph className="review-form-card__desc">
        你可以输入 GitHub PR 链接，也可以在暂未接入 GitHub API 时手动粘贴 diff 文本进行分析。
      </Paragraph>

      <Form<ReviewFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          inputType: DEFAULT_INPUT_TYPE,
          shouldMockError: false,
        }}
        onFinish={handleFinish}
      >
        <Form.Item label="分析方式" name="inputType">
          <Radio.Group disabled={loading}>
            <Radio.Button value="prUrl">GitHub PR 链接</Radio.Button>
            <Radio.Button value="diffText">Diff 文本</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {inputType === 'prUrl' ? (
          <Form.Item
            label="GitHub PR 链接"
            name="prUrl"
            extra="示例：https://github.com/facebook/react/pull/123"
            rules={[
              {
                required: true,
                message: '请输入 GitHub PR 链接',
              },
              {
                type: 'url',
                message: '请输入合法链接，例如 https://github.com/owner/repo/pull/1',
              },
              {
                pattern: /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\/?$/,
                message: '请输入 GitHub Pull Request 链接',
              },
            ]}
          >
            <Input size="large" placeholder="请输入 GitHub PR 链接" allowClear disabled={loading} />
          </Form.Item>
        ) : (
          <Form.Item
            label="Diff 文本"
            name="diffText"
            extra="可以从 GitHub PR 的 Files changed 页面复制部分 diff 内容"
            rules={[
              {
                required: true,
                message: '请粘贴 diff 文本',
              },
              {
                min: 20,
                message: 'diff 文本过短，请输入更完整的代码变更内容',
              },
            ]}
          >
            <Input.TextArea
              rows={8}
              placeholder="请粘贴 diff 文本，例如：diff --git a/src/App.tsx b/src/App.tsx ..."
              allowClear
              disabled={loading}
            />
          </Form.Item>
        )}

        <Form.Item
          label="调试选项"
          name="shouldMockError"
          valuePropName="checked"
          extra="开启后，点击开始分析会模拟一次失败请求，用于测试错误状态。"
        >
          <Switch checkedChildren="失败" unCheckedChildren="正常" disabled={loading} />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" size="large" loading={loading}>
            {loading ? '分析中' : '开始分析'}
          </Button>

          <Button size="large" onClick={() => form.resetFields()} disabled={loading}>
            清空
          </Button>
        </Space>

        <div className="review-form-card__tip">
          <Text type="secondary">
            当前 PR 新增错误状态处理，可通过调试选项模拟分析失败。
          </Text>
        </div>
      </Form>
    </Card>
  );
}
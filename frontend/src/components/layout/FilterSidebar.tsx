import { Button, Checkbox, DatePicker, Divider, Space, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useFilterContext } from "../../contexts";
import { useAccounts } from "../../hooks";
import { fromTimestamp, toTimestamp } from "../../utils";
import "./FilterSidebar.css";

const { Title } = Typography;

export function FilterSidebar() {
  const {
    filters,
    allCategories,
    excludedCategories,
    setAccountIds,
    setCategoryNames,
    setDateRange,
    setDateRangeFromLastTransaction,
    setDateRangeFromToday,
    lastTransactionDate,
  } = useFilterContext();
  const { accounts } = useAccounts();

  const handleAccountChange = (checkedValues: string[]) => {
    setAccountIds(checkedValues);
  };

  const handleCategoryChange = (checkedValues: string[]) => {
    setCategoryNames(checkedValues);
  };

  const handleDateFromChange = (date: dayjs.Dayjs | null) => {
    setDateRange(
      date ? toTimestamp(date.toDate()) : null,
      filters.dateRange.to
    );
  };

  const handleDateToChange = (date: dayjs.Dayjs | null) => {
    setDateRange(
      filters.dateRange.from,
      date ? toTimestamp(date.toDate()) : null
    );
  };

  // Filter out excluded categories by default
  const availableCategories = allCategories.filter(
    (cat) => !excludedCategories.includes(cat)
  );

  return (
    <div className="filter-sidebar">
      <Title level={5}>סינון</Title>

      <Divider />

      <div className="filter-section">
        <Title level={5}>חשבונות</Title>
        <Checkbox.Group
          value={
            filters.accountIds.length
              ? filters.accountIds
              : accounts.map((a) => a.id)
          }
          onChange={(values) => handleAccountChange(values as string[])}>
          <Space direction="vertical">
            {accounts.map((account) => (
              <Checkbox key={account.id} value={account.id}>
                {account.name}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </div>

      <Divider />

      <div className="filter-section">
        <Title level={5}>טווח תאריכים</Title>
        <Space direction="vertical" className="date-pickers" style={{ width: "100%" }}>
          <div>
            <div className="label">מתאריך:</div>
            <DatePicker
              picker="month"
              value={
                filters.dateRange.from
                  ? dayjs(fromTimestamp(filters.dateRange.from))
                  : null
              }
              onChange={handleDateFromChange}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="label">עד תאריך:</div>
            <DatePicker
              picker="month"
              value={
                filters.dateRange.to
                  ? dayjs(fromTimestamp(filters.dateRange.to))
                  : null
              }
              onChange={handleDateToChange}
              style={{ width: "100%" }}
            />
          </div>
          <Space wrap style={{ marginTop: 8 }}>
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={setDateRangeFromToday}
            >
              שנה מהיום
            </Button>
            {lastTransactionDate && (
              <Button
                size="small"
                icon={<CalendarOutlined />}
                onClick={setDateRangeFromLastTransaction}
              >
                שנה מתנועה אחרונה
              </Button>
            )}
          </Space>
        </Space>
      </div>

      <Divider />

      <div className="filter-section">
        <Title level={5}>קטגוריות</Title>
        <div className="category-list">
          <Checkbox.Group
            value={
              filters.categoryNames.length
                ? filters.categoryNames
                : availableCategories
            }
            onChange={(values) => handleCategoryChange(values as string[])}>
            <Space direction="vertical">
              {availableCategories.map((category) => (
                <Checkbox key={category} value={category}>
                  {category}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </div>
    </div>
  );
}

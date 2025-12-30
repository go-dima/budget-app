from app.utils.excel_parser import parse_amount, parse_date


class TestParseDate:
    def test_parse_date_dd_mm_yyyy(self):
        timestamp, raw = parse_date("25/12/2024")
        assert timestamp is not None
        assert raw == "25/12/2024"

    def test_parse_date_with_dashes(self):
        timestamp, raw = parse_date("25-12-2024")
        assert timestamp is not None
        assert raw == "25-12-2024"

    def test_parse_date_none(self):
        timestamp, raw = parse_date(None)
        assert timestamp is None
        assert raw == ""


class TestParseAmount:
    def test_parse_amount_number(self):
        assert parse_amount(100.5) == 100.5

    def test_parse_amount_string(self):
        assert parse_amount("100.50") == 100.50

    def test_parse_amount_with_comma(self):
        assert parse_amount("1,000.50") == 1000.50

    def test_parse_amount_none(self):
        assert parse_amount(None) == 0.0

    def test_parse_amount_dash(self):
        assert parse_amount("-") == 0.0

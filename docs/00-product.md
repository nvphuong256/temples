# 00 · Sản phẩm

Chùa Việt 3D (tieuan.vn): ngôi chùa làng Bắc Bộ 3D trên trình duyệt, nhiều người cùng vào, không nói chuyện, chỉ thắp hương, lễ Phật, gõ mõ, lần tràng hạt, chắp tay chào. Mô hình Sansa (Hàn Quốc). Tiểu An là NPC ở tam quan.

**Không là:** cổng tin tức, kinh sách, CMS, đồng hồ thiền riêng, bình luận, quyên góp, AI.

## MVP (6 tuần)
- Không gian: tam quan, sân (lư hương, ao sen, cây đa, gác chuông), Đại Hùng Bảo Điện, tường bao; ngày/đêm theo giờ VN.
- Nghi lễ: thắp hương (+1), lễ Phật (+1/10 lạy), gõ mõ (+1 ngẫu nhiên 20 %), tràng hạt 108 (+3 trọn tràng), chắp tay chào (0), thỉnh chuông (1/20 s).
- Nhiều người: 10 phòng × 100, chọn phòng, hàng chờ ngoài tam quan.
- Nhân vật: chú tiểu áo nâu / Phật tử áo lam, tên ngẫu nhiên (`shared/src/names.ts`); Tiểu An NPC: greet, guide (đứng yên > 30 s lần đầu), bless (rời), meditate.
- Tài khoản: khách mặc định; magic link giữ tên, tên Tiểu An riêng, công đức.
- Quản trị: mở/đóng phòng, hoành phi/câu đối, lời thoại, online, công đức ngày.
- Mobile: joystick + 3 nút lớn; ≤ 8 MB tải; 30 fps máy tầm trung.

Phase 2: tụng kinh chung (khi có bản quyền), lễ theo mùa, lời ước, phòng riêng, model chuyên nghiệp, Google login.

Chỉ số: 1.000 người cùng lúc không sập; ≥ 4 phút trong chùa; ≥ 20 % quay lại trong 7 ngày.

## Luồng
Mở trang → tam quan (chọn avatar + tên, Tiểu An chào) → phòng còn chỗ? (đầy → hàng chờ) → sân (thắp hương, chắp tay) → chính điện (lễ, mõ, tràng hạt, chuông) → rời (Tiểu An chúc, tổng công đức, mời giữ bằng magic link).

## Điều khiển
Desktop: WASD/mũi tên, chuột xoay, cuộn zoom, nhấp sàn; phím 1–6 = hương, lễ, mõ, tràng hạt, chắp tay, chuông. Mobile: joystick trái, 3 nút phải (Hương, Lễ, Mõ) + menu, pinch zoom.

## Giọng Tiểu An
≤ 90 ký tự, xưng "Tiểu An" – gọi "bạn", ấm, không giáo điều, không hứa hẹn tâm linh, không quảng cáo; "A Di Đà Phật" chỉ ở greet/bless. Tên Tiểu An tùy chỉnh (thành viên): 2–20 ký tự, lọc từ cấm, không trùng danh hiệu Phật/Bồ Tát.

## Câu hỏi mở
1. Tên phòng: "Tiền đường 1–10" hay theo chùa nổi tiếng? 2. Bảng công đức có tên khách? 3. Log quốc gia truy cập? 4. Thuê model 3D trước hay sau ra mắt?

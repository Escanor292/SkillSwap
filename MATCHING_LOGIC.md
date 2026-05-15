# Cơ Chế Ghép Cặp (Matching Logic) - SkillSwap

Ứng dụng SkillSwap sử dụng thuật toán ghép cặp dựa trên sở thích và khả năng của người dùng để tối ưu hóa việc trao đổi kiến thức.

## 1. Dữ liệu đầu vào
Mỗi người dùng trong hệ thống (Firestore Collection: `users`) có hai danh sách kỹ năng:
- `skillsToTeach`: Những kỹ năng người dùng có thể dạy.
- `skillsToLearn`: Những kỹ năng người dùng muốn học.

## 2. Các loại hình ghép cặp

### A. Ghép cặp 1 chiều (Match)
Hệ thống sẽ gợi ý người dùng **B** cho người dùng **A** nếu:
> **Người B có thể dạy những gì người A muốn học.**
>
> *(B.skillsToTeach ∩ A.skillsToLearn ≠ Ø)*

### B. Ghép cặp 2 chiều (Mutual Match / 2-Way Match)
Đây là trường hợp lý tưởng nhất để trao đổi 1-1. Hệ thống xác định là ghép cặp 2 chiều khi:
1. Người B có thể dạy thứ người A muốn học.
2. **VÀ** người A cũng có thể dạy thứ người B muốn học.
> *(B.skillsToTeach ∩ A.skillsToLearn ≠ Ø) AND (A.skillsToTeach ∩ B.skillsToLearn ≠ Ø)*

## 3. Quy trình thực hiện trong Code (`MatchScreen.js`)

1. **Lấy dữ liệu người dùng hiện tại**: Truy vấn thông tin của bạn từ Firestore để lấy danh sách cần học và có thể dạy.
2. **Truy vấn toàn bộ danh sách sinh viên**: Lấy tất cả người dùng khác trong hệ thống.
3. **So khớp (Matching)**:
   - Duyệt qua từng người dùng khác.
   - Chuyển tất cả kỹ năng về chữ thường (lowercase) để so sánh chính xác.
   - Kiểm tra điều kiện Ghép cặp 1 chiều. Nếu không thỏa mãn, bỏ qua người này.
   - Nếu thỏa mãn 1 chiều, kiểm tra tiếp điều kiện 2 chiều.
4. **Sắp xếp & Hiển thị**:
   - Những người có **Ghép cặp 2 chiều** sẽ được ưu tiên đẩy lên đầu danh sách.
   - Những người này sẽ có nhãn (Badge) đặc biệt: **"🔄 Match 2 chiều"** để người dùng dễ nhận biết.

## 4. Lợi ích của cơ chế này
- **Tiết kiệm chi phí**: Trao đổi kỹ năng thay vì trả tiền thuê gia sư.
- **Tính cam kết cao**: Khi cả hai cùng có lợi, buổi học sẽ diễn ra nghiêm túc và hiệu quả hơn.
- **Mở rộng mối quan hệ**: Giúp sinh viên tìm thấy những người bạn có cùng đam mê và trình độ phù hợp.
## 5. Cơ chế Trao đổi Online (Video Call)
Để tối ưu hóa trải nghiệm mà không làm nặng ứng dụng, SkillSwap tích hợp cơ chế "External Meeting":
- **Linh hoạt**: Người dùng có thể sử dụng bất kỳ nền tảng nào họ thích (Google Meet, Zoom, Microsoft Teams, Zalo...).
- **Tự động hóa**: Khi tạo lịch học Online, người dùng dán link phòng họp vào. Hệ thống sẽ biến nó thành một liên kết có thể nhấp vào (Hyperlink).
- **Trải nghiệm mượt mà**: Đến giờ học, người tham gia chỉ cần vào mục "Lịch học" và bấm vào link, ứng dụng sẽ tự động chuyển hướng sang nền tảng Video Call tương ứng.

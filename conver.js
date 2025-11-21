// BIẾN TOÀN CỤC
        let vnptData = [];
        let misaProducts = [];
        let conversionResult = null;

        // XỬ LÝ UPLOAD FILE VNPT
        document.getElementById('vnptFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    vnptData = XLSX.utils.sheet_to_json(sheet);
                    
                    document.getElementById('vnptPreview').innerHTML = 
                        `<div class="success">✅ Đã tải ${vnptData.length} bản ghi từ file VNPT</div>`;
                    
                    checkProcessReady();
                } catch (error) {
                    console.error('Lỗi đọc file VNPT:', error);
                    document.getElementById('vnptPreview').innerHTML = 
                        `<div class="error">❌ Lỗi đọc file VNPT: ${error.message}</div>`;
                }
            };
            reader.readAsArrayBuffer(file);
        });

        // XỬ LÝ UPLOAD FILE MAPPING MISA
        document.getElementById('misaMappingFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    
                    misaProducts = parseMISAFileData(jsonData);
                    
                    const status = document.getElementById('mappingStatus');
                    if (misaProducts.length > 0) {
                        status.innerHTML = `<div class="success">✅ Đã tải ${misaProducts.length} sản phẩm từ file MISA</div>`;
                    } else {
                        status.innerHTML = `<div class="warning">⚠️ Không tìm thấy dữ liệu mã hàng. Kiểm tra cột "Mã hàng" và "Tên hàng"</div>`;
                    }
                    
                    updateMappingPreview();
                    checkProcessReady();
                    
                } catch (error) {
                    console.error('Lỗi đọc file MISA:', error);
                    document.getElementById('mappingStatus').innerHTML = 
                        `<div class="error">❌ Lỗi đọc file MISA: ${error.message}</div>`;
                }
            };
            reader.readAsArrayBuffer(file);
        });
// HÀM TẢI FILE MẪU MISA ĐƠN GIẢN
// HÀM TẢI FILE MẪU MISA ĐƠN GIẢN
function downloadMISASample() {
    // Tạo workbook Excel
    const wb = XLSX.utils.book_new();
    
    // Dữ liệu mẫu - chỉ 2 cột: Mã hàng và Tên hàng
    const misaSampleData = [
        ['Mã hàng', 'Tên hàng'],
        ['SPRITE', 'Sprite lon'],
        ['NCCma', 'Nước suối Lemona'],
        ['STINGD', 'Sting Dâu tây đỏ Lon 520x24 Tray Lốc 8'],
        ['AQUA', 'Nước suối Aquafina 500ml'],
        ['COCA', 'Coca Cola lon 330ml'],
        ['PEPSI', 'Pepsi chai 1.5L'],
        ['TIGER', 'Bia Tiger lon 330ml'],
        ['HEINE', 'Bia Heineken chai 330ml'],
        ['REDBULL', 'Red Bull 250ml'],
        ['TWISTER', 'Nước ép trái cây Twister 1L']
    ];
    
    // Tạo worksheet
    const ws = XLSX.utils.aoa_to_sheet(misaSampleData);
    
    // Đặt độ rộng cột cho đẹp
    ws['!cols'] = [
        { wch: 15 },  // Mã hàng
        { wch: 40 }   // Tên hàng
    ];
    
    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'DanhMucHangHoa');
    
    // Tải file về
    XLSX.writeFile(wb, 'MAU_FILE_MISA.xlsx');
    
    // Thông báo
    alert('✅ Đã tải file MISA mẫu thành công!');
}
        // HÀM PARSE DỮ LIỆU TỪ FILE MISA
        function parseMISAFileData(jsonData) {
            const products = [];
            
            jsonData.forEach(row => {
                // Tìm cột mã hàng và tên hàng (case insensitive)
                const code = findColumnValue(row, ['mã hàng', 'mahang', 'code', 'mã']);
                const name = findColumnValue(row, ['tên hàng', 'tenhang', 'name', 'tên', 'tên sản phẩm']);
                
                if (code && name) {
                    products.push({
                        code: code.toString().trim(),
                        name: name.toString().trim()
                    });
                }
            });
            
            return products;
        }

        // HÀM TÌM GIÁ TRỊ CỘT (case insensitive)
        function findColumnValue(row, possibleColumnNames) {
            for (const colName of possibleColumnNames) {
                for (const key in row) {
                    if (key.toLowerCase().includes(colName.toLowerCase())) {
                        return row[key];
                    }
                }
            }
            return null;
        }

        // XEM TRƯỚC MAPPING
        function updateMappingPreview() {
            const preview = document.getElementById('mappingPreview');
            
            if (misaProducts.length === 0) {
                preview.innerHTML = '<div class="info">Chưa có dữ liệu mapping</div>';
                return;
            }
            
            let html = `
                <div class="success">📋 Danh sách mã hàng đã tải:</div>
                <table>
                    <tr><th>Mã hàng</th><th>Tên hàng</th></tr>
            `;
            
            // Hiển thị tối đa 10 sản phẩm để preview
            misaProducts.slice(0, 10).forEach(product => {
                html += `
                    <tr>
                        <td><strong>${product.code}</strong></td>
                        <td>${product.name}</td>
                    </tr>
                `;
            });
            
            html += '</table>';
            
            if (misaProducts.length > 10) {
                html += `<div class="info">... và ${misaProducts.length - 10} sản phẩm khác</div>`;
            }
            
            preview.innerHTML = html;
        }

        // KIỂM TRA SẴN SÀNG XỬ LÝ
        function checkProcessReady() {
            const btn = document.getElementById('processBtn');
            const vnptReady = vnptData.length > 0;
            const misaReady = misaProducts.length > 0;
            
            btn.disabled = !(vnptReady && misaReady);
            
            if (vnptReady && misaReady) {
                document.getElementById('processResult').innerHTML = 
                    '<div class="success">✅ Đã sẵn sàng xử lý</div>';
            }
        }

        // XỬ LÝ CHÍNH
        document.getElementById('processBtn').addEventListener('click', function() {
            console.log('processConversion called');
            console.log('vnptData:', vnptData);
            console.log('misaProducts:', misaProducts);
            
            if (vnptData.length === 0 || misaProducts.length === 0) {
                alert('Vui lòng upload file VNPT và file mã hàng MISA');
                return;
            }
            
            try {
                document.getElementById('processResult').innerHTML = '<div class="info">🔄 Đang xử lý...</div>';
                
                conversionResult = convertVNPTtoMISA(vnptData, misaProducts);
                displayResults(conversionResult);
                document.getElementById('downloadBtn').disabled = false;
                
                document.getElementById('processResult').innerHTML = 
                    '<div class="success">✅ Xử lý thành công!</div>';
                    
            } catch (error) {
                console.error('Conversion error:', error);
                document.getElementById('processResult').innerHTML = 
                    `<div class="error">❌ Lỗi khi xử lý: ${error.message}</div>`;
            }
        });


// THÊM HÀM formatDateForMISA VÀO
function formatDateForMISA(dateStr) {
    if (!dateStr) return '';
    // Chuyển từ yyyy-mm-dd thành dd/mm/yyyy
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}
// SỬA HÀM normalizeProductName - THÊM KIỂM TRA UNDEFINED
function normalizeProductName(productName) {
    if (!productName) return ''; // THÊM DÒNG NÀY
    
    return productName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// SỬA HÀM mapProductWithCustomMapping - THÊM VALIDATION
function mapProductWithCustomMapping(vnptProductName, misaProducts, vnptRow) {
    // KIỂM TRA DỮ LIỆU ĐẦU VÀO
    if (!vnptProductName) {
        console.warn('⚠️ Tên sản phẩm VNPT bị trống, tạo mã mới');
        const newCode = generateNewProductCode('SP_KHONG_TEN', misaProducts);
        return {
            code: newCode,
            name: 'Sản phẩm không tên',
            isNew: true,
            originalName: ''
        };
    }
    
    const candidates = [];
    
    for (const misaProduct of misaProducts) {
        // KIỂM TRA MISAPRODUCT
        if (!misaProduct || !misaProduct.name) {
            console.warn('⚠️ Sản phẩm MISA không hợp lệ:', misaProduct);
            continue;
        }
        
        const score = calculateMatchScore(vnptProductName, misaProduct.name, vnptRow, misaProduct);
        
        const hasNumbers = (vnptProductName.match(/\d+/g) || []).length > 0;
        const threshold = hasNumbers ? 0.8 : 0.7;
        
        if (score.totalScore >= threshold && score.numberConsistency >= 0.7) {
            candidates.push({
                product: misaProduct,
                score: score.totalScore,
                details: score
            });
        }
    }
    
    if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        const bestMatch = candidates[0];
        return { 
            ...bestMatch.product, 
            isNew: false, 
            originalName: vnptProductName 
        };
    }
    
    const newCode = generateNewProductCode(vnptProductName, misaProducts);
    return {
        code: newCode,
        name: vnptProductName,
        isNew: true,
        originalName: vnptProductName
    };
}

// SỬA HÀM calculateMatchScore - THÊM VALIDATION
function calculateMatchScore(vnptName, misaName, vnptRow, misaProduct) {
    let scores = {
        nameSimilarity: 0,
        keywordMatch: 0,
        numberConsistency: 0,
        priceSimilarity: 1,
        totalScore: 0
    };
    
    // KIỂM TRA DỮ LIỆU ĐẦU VÀO
    if (!vnptName || !misaName) {
        console.warn('⚠️ Tên sản phẩm không hợp lệ:', { vnptName, misaName });
        return scores;
    }
    
    const normalizedVNPT = normalizeProductName(vnptName);
    const normalizedMisa = normalizeProductName(misaName);
    
    // 1. ĐỘ TƯƠNG ĐỒNG TÊN (30%)
    scores.nameSimilarity = calculateStringSimilarity(normalizedVNPT, normalizedMisa);
    
    // 2. KHỚP TỪ KHÓA + SỐ (40%)
    const vnptKeywords = extractKeywordsWithNumbers(vnptName);
    const misaKeywords = extractKeywordsWithNumbers(misaName);
    
    const commonKeywords = vnptKeywords.filter(kw => misaKeywords.includes(kw));
    scores.keywordMatch = commonKeywords.length / Math.max(vnptKeywords.length, misaKeywords.length, 1);
    
    // 3. KIỂM TRA TÍNH NHẤT QUÁN CỦA SỐ (20%)
    scores.numberConsistency = checkNumberConsistency(vnptName, misaName);
    
    // 4. KIỂM TRA ĐƠN GIÁ (10%)
    if (vnptRow && vnptRow['DonGia'] && misaProduct && misaProduct.price) {
        const vnptPrice = parseFloat(vnptRow['DonGia']);
        const misaPrice = parseFloat(misaProduct.price);
        if (!isNaN(vnptPrice) && !isNaN(misaPrice) && misaPrice > 0) {
            const priceDiff = Math.abs(vnptPrice - misaPrice) / Math.max(vnptPrice, misaPrice);
            scores.priceSimilarity = 1 - Math.min(priceDiff, 1);
        }
    }
    
    scores.totalScore = (
        scores.nameSimilarity * 0.3 +
        scores.keywordMatch * 0.4 + 
        scores.numberConsistency * 0.2 +
        scores.priceSimilarity * 0.1
    );
    
    return scores;
}

        function calculateStringSimilarity(str1, str2) {
            const longer = str1.length > str2.length ? str1 : str2;
            const shorter = str1.length > str2.length ? str2 : str1;
            
            if (longer.length === 0) return 1.0;
            
            const distance = levenshteinDistance(longer, shorter);
            return (longer.length - distance) / longer.length;
        }

        function levenshteinDistance(str1, str2) {
            const matrix = [];
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i-1) === str1.charAt(j-1)) {
                        matrix[i][j] = matrix[i-1][j-1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i-1][j-1] + 1,
                            matrix[i][j-1] + 1,
                            matrix[i-1][j] + 1
                        );
                    }
                }
            }
            return matrix[str2.length][str1.length];
        }

        function checkNumberConsistency(name1, name2) {
            const numbers1 = (name1.match(/\d+/g) || []).sort();
            const numbers2 = (name2.match(/\d+/g) || []).sort();
            
            if (numbers1.length === 0 && numbers2.length === 0) return 1;
            if (numbers1.length !== numbers2.length) return 0;
            
            let matchCount = 0;
            for (let i = 0; i < numbers1.length; i++) {
                if (numbers1[i] === numbers2[i]) {
                    matchCount++;
                }
            }
            
            return matchCount / numbers1.length;
        }

        function extractKeywordsWithNumbers(productName) {
            const stopWords = ['nước', 'lon', 'chai', 'tray', 'lốc', 'bình', 'thùng', 'cho', 'từ', 'đến', 'kg', 'ngày', 'tuổi', 'tahh', 'hc', 'ip', 'cc', 'đb'];
            
            return productName
                .toLowerCase()
                .split(/[\s\/\(\)]/)
                .filter(word => word.length > 1 && !stopWords.includes(word))
                .map(word => word.trim());
        }

// XỬ LÝ UPLOAD FILE (CẢ VNPT VÀ VIETTEL)
document.getElementById('vnptFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // PHÂN LOẠI VÀ XỬ LÝ FILE
            vnptData = classifyAndProcessFile(data, workbook);
            
            // HIỂN THỊ KẾT QUẢ PHÂN LOẠI
            const fileType = vnptData.length > 0 ? vnptData[0].FileType || 'VNPT' : 'VNPT';
            
            document.getElementById('vnptPreview').innerHTML = 
                `<div class="success">✅ Đã tải ${vnptData.length} bản ghi từ file ${fileType}</div>
                 <div class="info" style="margin-top: 10px;">
                    <strong>Mẫu dữ liệu:</strong><br>
                    ${vnptData.slice(0, 3).map(row => 
                        `HD ${row.SoHoaDon}: ${row.MatHang} - SL: ${row.SoLuong}`
                    ).join('<br>')}
                 </div>
                 <div class="warning" style="margin-top: 5px;">
                    📁 Loại file: ${fileType}
                 </div>`;
            
            checkProcessReady();
        } catch (error) {
            console.error('Lỗi đọc file:', error);
            document.getElementById('vnptPreview').innerHTML = 
                `<div class="error">❌ Lỗi đọc file: ${error.message}</div>`;
        }
    };
    reader.readAsArrayBuffer(file);
});


function parseVNPTFileData(jsonData) {
    const realData = [];
    
    console.log('🔍 Phân tích file VNPT - Quét theo phân loại thuế suất');
    console.log('Tổng số dòng:', jsonData.length);

    let currentTaxRate = '8'; // Mặc định 8%
    let inDataSection = false;
    let consecutiveEmpty = 0;
    
    // HÀM CHUYỂN ĐỔI SỐ AN TOÀN CHO VNPT
    const safeParseNumber = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        
        const strValue = value.toString().trim();
        
        // Loại bỏ dấu phân cách hàng nghìn, giữ nguyên dấu thập phân
        const cleanValue = strValue
            .replace(/\./g, '') // Loại bỏ dấu chấm phân cách hàng nghìn (1.000 -> 1000)
            .replace(/,/g, '.'); // Chuyển dấu phẩy thập phân thành chấm (0,5 -> 0.5)
        
        const numValue = parseFloat(cleanValue);
        return isNaN(numValue) ? 0 : numValue;
    };
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Lấy tất cả giá trị của dòng để kiểm tra
        const rowValues = Object.values(row);
        const rowString = rowValues.join(' ');
        
        // DEBUG: In 10 dòng đầu để kiểm tra
        if (i < 10) {
            console.log(`Dòng ${i}:`, rowValues);
        }
        
        // QUÉT PHÂN LOẠI THUẾ SUẤT
        if (rowString.includes('Hàng hoá, dịch vụ chịu thuế suất thuế GTGT')) {
            console.log(`🎯 PHÁT HIỆN PHÂN LOẠI THUẾ tại dòng ${i}: ${rowString}`);
            
            if (rowString.includes('10%')) {
                currentTaxRate = '10';
                console.log(`💰 Áp dụng thuế suất: ${currentTaxRate}%`);
            } else if (rowString.includes('8%')) {
                currentTaxRate = '8';
                console.log(`💰 Áp dụng thuế suất: ${currentTaxRate}%`);
            } else if (rowString.includes('5%')) {
                currentTaxRate = '5';
                console.log(`💰 Áp dụng thuế suất: ${currentTaxRate}%`);
            } else if (rowString.includes('0%')) {
                currentTaxRate = '0';
                console.log(`💰 Áp dụng thuế suất: ${currentTaxRate}%`);
            }
            
            inDataSection = true;
            consecutiveEmpty = 0;
            continue;
        }
        
        // Nếu đang trong vùng dữ liệu, tìm các dòng có dữ liệu thực
        if (inDataSection) {
            // Kiểm tra xem đây có phải dòng dữ liệu thực không
            const stt = row['__EMPTY'] || row['STT'] || row['__EMPTY_1'];
            const soHoaDon = row['__EMPTY_5'] || row['Số hoá đơn'] || row['Số hóa đơn'];
            const tenHang = row['__EMPTY_9'] || row['Mặt Hàng'] || row['Tên hàng'];
            
            const isDataRow = stt && !isNaN(parseInt(stt)) && soHoaDon && tenHang;
            
            if (isDataRow) {
                console.log(`✅ PHÁT HIỆN DÒNG DỮ LIỆU tại dòng ${i} - Thuế ${currentTaxRate}%`);
                consecutiveEmpty = 0;
                
                // Lấy giá trị gốc để debug
                const rawSoLuong = row['__EMPTY_10'] || row['Số lượng'] || 0;
                const rawDonGia = row['__EMPTY_11'] || row['Đơn giá'] || 0;
                const rawDoanhSo = row['__EMPTY_12'] || row['Doanh số bán chưa có thuế'] || 0;
                const rawThueGTGT = row['__EMPTY_13'] || row['Thuế GTGT'] || 0;
                
                // Map dòng dữ liệu với thuế suất hiện tại - SỬ DỤNG HÀM CHUYỂN ĐỔI SỐ AN TOÀN
                const mappedRow = {
                    // STT
                    'STT': row['__EMPTY'] || row['STT'] || row['__EMPTY_1'],
                    // Mã hóa đơn, Ký hiệu mẫu hóa đơn, Ký hiệu hoá đơn
                    'MaHD': row['__EMPTY_2'] || row['Mã hóa đơn'],
                    'MauHD': row['__EMPTY_3'] || row['Ký hiệu mẫu hóa đơn'],
                    'KyHieuHD': row['__EMPTY_4'] || row['Ký hiệu hoá đơn'],
                    // Số hoá đơn
                    'SoHoaDon': row['__EMPTY_5'] || row['Số hoá đơn'],
                    // Ngày, tháng, năm phát hành
                    'NgayHoaDon': row['__EMPTY_6'] || row['Ngày, tháng, năm phát hành'],
                    // Tên người mua
                    'TenNguoiMua': row['__EMPTY_7'] || row['Tên người mua'],
                    // Mã số thuế người mua
                    'MST': row['__EMPTY_8'] || row['Mã số thuế người mua'],
                    // Mặt Hàng
                    'MatHang': row['__EMPTY_9'] || row['Mặt Hàng'],
                    // Số lượng - SỬ DỤNG HÀM CHUYỂN ĐỔI SỐ AN TOÀN
                    'SoLuong': safeParseNumber(rawSoLuong),
                    // Đơn giá - SỬ DỤNG HÀM CHUYỂN ĐỔI SỐ AN TOÀN
                    'DonGia': safeParseNumber(rawDonGia),
                    // Doanh số bán chưa có thuế - SỬ DỤNG HÀM CHUYỂN ĐỔI SỐ AN TOÀN
                    'DoanhSo': safeParseNumber(rawDoanhSo),
                    // Thuế GTGT - SỬ DỤNG HÀM CHUYỂN ĐỔI SỐ AN TOÀN
                    'ThueGTGT': safeParseNumber(rawThueGTGT),
                    // Ghi chú
                    'GhiChu': row['__EMPTY_14'] || row['Ghi chú'] || '',
                    // Thuế suất đã xác định
                    'TaxRate': currentTaxRate,
                    // Lưu giá trị gốc để debug
                    '_OriginalValues': {
                        'SoLuong': rawSoLuong,
                        'DonGia': rawDonGia,
                        'DoanhSo': rawDoanhSo,
                        'ThueGTGT': rawThueGTGT
                    }
                };
                
                // DEBUG: Kiểm tra chuyển đổi số
                if (rawDoanhSo && rawDoanhSo.toString() !== mappedRow.DoanhSo.toString()) {
                    console.log(`🔢 VNPT - Chuyển đổi số: "${rawDoanhSo}" -> ${mappedRow.DoanhSo}`);
                }
                
                if (mappedRow.SoHoaDon && mappedRow.MatHang) {
                    realData.push(mappedRow);
                    console.log(`📝 Đã map: HD ${mappedRow.SoHoaDon} - ${mappedRow.MatHang} - Thuế ${mappedRow.TaxRate}%`);
                }
            } else if (rowValues.includes("Tổng Cộng") || rowValues.includes("Tổng cộng")) {
                console.log(`📊 KẾT THÚC PHÂN LOẠI tại dòng ${i} - Tổng cộng`);
                inDataSection = false;
            } else if (rowString.trim() === '' || rowValues.every(val => !val || val === '')) {
                // Dòng trống
                consecutiveEmpty++;
                console.log(`⏭️ Dòng ${i} trống (consecutiveEmpty: ${consecutiveEmpty})`);
                
                // Nếu đã bỏ qua 3 dòng liên tiếp trống -> kết thúc phân loại này
                if (consecutiveEmpty >= 3) {
                    console.log(`🛑 Đã bỏ qua ${consecutiveEmpty} dòng trống - KẾT THÚC PHÂN LOẠI`);
                    inDataSection = false;
                }
            } else {
                consecutiveEmpty = 0; // Reset nếu có dữ liệu nhưng không phải dòng dữ liệu
            }
        }
    }
    
    console.log(`✅ Đã trích xuất ${realData.length} bản ghi hợp lệ`);
    
    // DEBUG số liệu VNPT
    if (realData.length > 0) {
        console.log('🔢 DEBUG SỐ LIỆU VNPT:');
        realData.slice(0, 3).forEach((row, index) => {
            console.log(`Dòng ${index + 1}:`);
            console.log(`  - Đơn giá: "${row._OriginalValues.DonGia}" -> ${row.DonGia}`);
            console.log(`  - Doanh số: "${row._OriginalValues.DoanhSo}" -> ${row.DoanhSo}`);
            console.log(`  - Thuế GTGT: "${row._OriginalValues.ThueGTGT}" -> ${row.ThueGTGT}`);
        });
    }
    
    return realData;
}// HÀM MAP DÒNG DỮ LIỆU VNPT VỚI THUẾ SUẤT
function mapVNPTDataRow(rowValues, taxRate) {
    console.log('🔍 Mapping dòng dữ liệu với thuế suất:', taxRate, rowValues);
    
    // Tìm các giá trị trong row
    let soHoaDon = null;
    let tenHang = null;
    let soLuong = null;
    let donGia = null;
    let doanhSo = null;
    let thueGTGT = null;
    let ngayHoaDon = null;
    let tenNguoiMua = null;
    let maSoThue = null;
    
    // Tìm các giá trị dựa trên pattern
    for (let i = 0; i < rowValues.length; i++) {
        const value = rowValues[i];
        
        if (!value || value === '') continue;
        
        // Tìm số hóa đơn
        if (!soHoaDon && typeof value === "string" && value.startsWith("00000")) {
            soHoaDon = value;
        }
        
        // Tìm tên hàng (sau số hóa đơn)
        if (!tenHang && soHoaDon && i > rowValues.indexOf(soHoaDon) && 
            typeof value === "string" && value.length > 5) {
            if (value.includes('Aquafina') || value.includes('Coca') || value.includes('Pepsi') || 
                value.includes('Bia') || value.includes('Nước') || value.includes('Sting') ||
                value.includes('Sprite') || value.includes('Dasani') || value.includes('Tiger') ||
                value.includes('Heineken') || value.includes('Bánh') || value.includes('Kẹo')) {
                tenHang = value;
            }
        }
        
        // Tìm số lượng
        if (!soLuong && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && parseFloat(value) < 10000) {
            soLuong = parseFloat(value);
        }
        
        // Tìm đơn giá
        if (!donGia && !isNaN(parseFloat(value)) && parseFloat(value) > 1000 && parseFloat(value) < 10000000) {
            donGia = parseFloat(value);
        }
        
        // Tìm doanh số
        if (!doanhSo && !isNaN(parseFloat(value)) && parseFloat(value) > 10000 && parseFloat(value) < 100000000) {
            doanhSo = parseFloat(value);
        }
        
        // Tìm thuế GTGT
        if (!thueGTGT && !isNaN(parseFloat(value)) && parseFloat(value) > 100 && parseFloat(value) < 10000000) {
            thueGTGT = parseFloat(value);
        }
        
        // Tìm ngày (dd/mm/yyyy)
        if (!ngayHoaDon && typeof value === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
            ngayHoaDon = value;
        }
        
        // Tìm tên người mua
        if (!tenNguoiMua && typeof value === "string" && 
            (value.includes('CÔNG TY') || value.includes('HỘ KINH DOANH') || value.includes('CÔNG ĐOÀN'))) {
            tenNguoiMua = value;
        }
        
        // Tìm mã số thuế
        if (!maSoThue && typeof value === "string" && /^\d{9,14}[-]?\d*$/.test(value)) {
            maSoThue = value;
        }
    }
    
    const mappedRow = {
        'SoHoaDon': soHoaDon,
        'MatHang': tenHang,
        'SoLuong': soLuong,
        'DonGia': donGia,
        'DoanhSo': doanhSo,
        'ThueGTGT': thueGTGT,
        'NgayHoaDon': ngayHoaDon,
        'TenNguoiMua': tenNguoiMua,
        'MST': maSoThue,
        'TaxRate': taxRate // Thêm thuế suất đã xác định
    };
    
    console.log('✅ Dòng mapped:', mappedRow);
    return mappedRow;
}
// CẬP NHẬT HÀM CHUYỂN ĐỔI - SỬ DỤNG THUẾ SUẤT TỪ VIETTEL
// CẬP NHẬT HÀM CHUYỂN ĐỔI - GIỮ NGUYÊN SỐ LIỆU TỪ FILE + THÊM MÃ KHÁCH HÀNG
function convertVNPTtoMISA(vnptData, misaProducts) {
    const result = [];
    const newProducts = [];
    const usedMappings = new Set();
    
    // BIẾN ĐỂ THEO DÕI MÃ KHÁCH HÀNG
    const customerCodeMap = new Map();
    const customerCodeCounter = new Set();
    
    console.log('🔍 Bắt đầu chuyển đổi - Giữ nguyên số liệu từ file + Tạo mã KH');
    
    vnptData.forEach((vnptRow, index) => {
        const misaRow = {};
        const fileType = vnptRow['FileType'] || 'VNPT';
        
        // SỬ DỤNG SỐ LIỆU CHÍNH XÁC TỪ FILE
        const phanTramThueGTGT = vnptRow['TaxRate'] || '8';
        const donGia = vnptRow['DonGia'] || 0;
        const thueGTGT = vnptRow['ThueGTGT'] || 0;
        const soLuong = vnptRow['SoLuong'] || 0;
        const doanhSo = vnptRow['DoanhSo'] || 0;
        const tenKhachHang = vnptRow['TenNguoiMua'] || 'Khách hàng';
        
        console.log(`📊 Dòng ${index + 1}: SL=${soLuong}, ĐG=${donGia}, DS=${doanhSo}, Thuế=${thueGTGT}`);
        
        // === TẠO MÃ KHÁCH HÀNG ===
        let maKhachHang = '';
        if (customerCodeMap.has(tenKhachHang)) {
            // Dùng mã đã tạo trước đó
            maKhachHang = customerCodeMap.get(tenKhachHang);
        } else {
            // Tạo mã mới
            maKhachHang = generateCustomerCode(tenKhachHang, customerCodeCounter);
            customerCodeMap.set(tenKhachHang, maKhachHang);
            console.log(`👤 Tạo mã KH: "${tenKhachHang}" -> ${maKhachHang}`);
        }
        
        // === ÁNH XẠ CÁC CỘT MISA - GIỮ NGUYÊN SỐ LIỆU ===
        misaRow['Ngày hạch toán (*)'] = formatDateForMISA(vnptRow['NgayHoaDon']);
        misaRow['Ngày chứng từ (*)'] = formatDateForMISA(vnptRow['NgayHoaDon']);
        misaRow['Số chứng từ (*)'] = vnptRow['SoHoaDon'];
        misaRow['Số phiếu xuất'] = vnptRow['SoHoaDon'];
        misaRow['Số hóa đơn'] = vnptRow['SoHoaDon'];
        misaRow['Ngày hóa đơn'] = formatDateForMISA(vnptRow['NgayHoaDon']);
        misaRow['Mã khách hàng'] = maKhachHang; // THÊM MÃ KHÁCH HÀNG
        misaRow['Tên khách hàng'] = tenKhachHang;
        misaRow['Mã số thuế'] = vnptRow['MST'] || '';
        misaRow['Diễn giải'] = `Bán cho ${tenKhachHang}`;
        
        // Ánh xạ sản phẩm
        const productInfo = mapProductWithCustomMapping(vnptRow['MatHang'], misaProducts, vnptRow);
        misaRow['Mã hàng (*)'] = productInfo.code;
        misaRow['Tên hàng'] = productInfo.name;
        misaRow['TK Tiền/Chi phí/Nợ (*)'] = '131';
        misaRow['TK Doanh thu/Có (*)'] = '5111';
        misaRow['ĐVT'] = 'cái';
        misaRow['Số lượng'] = soLuong; // Giữ nguyên từ file
        
        // GIỮ NGUYÊN GIÁ TRỊ TỪ FILE - KHÔNG TÍNH TOÁN
        misaRow['Đơn giá sau thuế'] = donGia; // Giữ nguyên đơn giá từ file
        misaRow['Đơn giá'] = donGia; // Giữ nguyên đơn giá từ file
        misaRow['Thành tiền'] = doanhSo; // Giữ nguyên doanh số từ file
        
        // THUẾ - GIỮ NGUYÊN TỪ FILE
        misaRow['% thuế GTGT'] = phanTramThueGTGT;
        misaRow['Tiền thuế GTGT'] = thueGTGT; // Giữ nguyên từ file
        misaRow['TK thuế GTGT'] = '33311';
        
        // Các cột khác
        misaRow['Kho'] = 'KHO1';
        misaRow['TK giá vốn'] = '632';
        misaRow['TK Kho'] = '156';
        
        // Các cột mặc định (LOẠI BỎ 'Mã khách hàng' VÌ ĐÃ ĐƯỢC THÊM Ở TRÊN)
        const defaultColumns = [
            'Hiển thị trên sổ', 'Hình thức bán hàng', 'Phương thức thanh toán',
            'Kiêm phiếu xuất kho', 'XK vào khu phi thuế quan và các TH được coi như XK',
            'Lập kèm hóa đơn', 'Đã lập hóa đơn', 'Lý do xuất', 'Địa chỉ',
            'Nộp vào TK', 'NV bán hàng', 'Hàng khuyến mại', 'Tỷ lệ CK (%)', 'Tiền chiết khấu',
            'TK chiết khấu', 'Giá tính thuế XK', '% thuế XK', 'Tiền thuế XK', 'TK thuế XK',
            'Tỷ lệ tính thuế (Thuế suất KHAC)', 'HH không TH trên tờ khai thuế GTGT',
            'Đơn giá vốn', 'Tiền vốn', 'Hàng hóa giữ hộ/bán hộ'
        ];
        
        defaultColumns.forEach(col => {
            misaRow[col] = '';
        });
        
        // Theo dõi sản phẩm
        if (productInfo.isNew) {
            newProducts.push(productInfo);
        } else {
            usedMappings.add(productInfo.code);
        }
        
        result.push(misaRow);
    });
    
    // HIỂN THỊ DANH SÁCH MÃ KHÁCH HÀNG ĐÃ TẠO
    console.log('📋 Danh sách mã khách hàng đã tạo:');
    customerCodeMap.forEach((code, name) => {
        console.log(`- ${code}: ${name}`);
    });
    
    return {
        data: result,
        newProducts: newProducts,
        usedMappings: Array.from(usedMappings),
        customerCodes: Array.from(customerCodeMap.entries()),
        summary: {
            totalRecords: result.length,
            mappedProducts: usedMappings.size,
            newProducts: newProducts.length,
            totalCustomers: customerCodeMap.size
        }
    };
}
function debugViettelFileStructure(jsonData) {
    console.log('🔍 DEBUG CHI TIẾT FILE VIETTEL:');
    
    // Hiển thị 10 dòng đầu với đầy đủ thông tin
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        console.log(`--- Dòng ${i} ---`);
        console.log('Tất cả keys:', Object.keys(row));
        console.log('Tất cả values:', Object.values(row));
        
        // Tìm các cột quan trọng
        const importantColumns = {};
        Object.keys(row).forEach(key => {
            if (key.includes('Số hóa đơn') || key.includes('Tên hàng') || 
                key.includes('Số lượng') || key.includes('Đơn giá')) {
                importantColumns[key] = row[key];
            }
        });
        console.log('Cột quan trọng:', importantColumns);
    }
}


// HÀM TÌM GIÁ TRỊ THEO PATTERN KEY
function findValueByKeyPattern(row, patterns) {
    for (const pattern of patterns) {
        for (const key in row) {
            if (key.includes(pattern)) {
                return row[key];
            }
        }
    }
    return null;
}

// HÀM PARSE ALTERNATIVE - CHO FILE CÓ CẤU TRÚC KHÁC
function parseViettelAlternative(jsonData) {
    const realData = [];
    console.log('🔄 Sử dụng alternative parser cho Viettel');
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowValues = Object.values(row);
        
        // Bỏ qua dòng trống
        if (rowValues.every(val => !val || val === '')) continue;
        
        // TÌM SỐ HÓA ĐƠN: giá trị số dài 8-12 ký tự
        let soHoaDon = null;
        let tenHang = null;
        
        for (const value of rowValues) {
            if (!value) continue;
            
            const strValue = value.toString().trim();
            
            // Tìm số hóa đơn (dạng số)
            if (!soHoaDon && /^\d{8,12}$/.test(strValue)) {
                soHoaDon = strValue;
            }
            
            // Tìm tên hàng (chứa từ khóa sản phẩm)
            if (!tenHang && typeof value === 'string' && value.length > 3) {
                if (value.includes('Aquafina') || value.includes('Coca') || value.includes('Pepsi') || 
                    value.includes('Bia') || value.includes('Nước') || value.includes('Sting') ||
                    value.includes('Sprite') || value.includes('Dasani') || value.includes('Tiger') ||
                    value.includes('Heineken') || value.includes('Bánh') || value.includes('Kẹo') ||
                    value.includes('Lon') || value.includes('Chai') || value.includes('Thùng') ||
                    value.includes('Bia') || value.includes('Nước')) {
                    tenHang = value;
                }
            }
        }
        
        if (soHoaDon && tenHang) {
            console.log(`✅ Alternative tìm thấy: HD ${soHoaDon} - ${tenHang}`);
            
            const mappedRow = {
                'STT': realData.length + 1,
                'SoHoaDon': soHoaDon,
                'MatHang': tenHang,
                'SoLuong': 1,
                'DonGia': 0,
                'DoanhSo': 0,
                'ThueGTGT': 0,
                'NgayHoaDon': '',
                'TenNguoiMua': 'Khách hàng Viettel',
                'MST': '',
                'TaxRate': '10',
                'FileType': 'VIETTEL'
            };
            
            realData.push(mappedRow);
        }
    }
    
    console.log(`✅ Alternative parser: ${realData.length} bản ghi`);
    return realData;
}

// HÀM TÌM GIÁ TRỊ CỘT TRONG FILE VIETTEL - CẬP NHẬT
function findViettelColumnValue(row, possibleColumnNames) {
    for (const colName of possibleColumnNames) {
        // Thử tìm đúng tên cột trong file Viettel
        if (row[colName] !== undefined) {
            return row[colName];
        }
        
        // Tìm theo key không dấu/viết thường
        for (const key in row) {
            const normalizedKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normalizedColName = colName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            if (normalizedKey.includes(normalizedColName)) {
                return row[key];
            }
        }
    }
    return null;
}

      function generateNewProductCode(productName, existingProducts) {
            const existingCodes = existingProducts.map(p => p.code);
            
            let baseCode = productName
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 6);
            
            if (!baseCode) baseCode = 'SP';
            
            let counter = 1;
            let newCode = baseCode;
            
            while (existingCodes.includes(newCode)) {
                newCode = `${baseCode}${counter}`;
                counter++;
                if (counter > 100) break;
            }
            
            return newCode;
        }
// HÀM CONVERT CŨ CHO VNPT - GIỮ NGUYÊN CẤU TRÚC
function convertArrayToObjectForVNPT(arrayData) {
    if (!arrayData || arrayData.length < 2) return [];
    
    const headers = arrayData[0];
    const result = [];
    
    for (let i = 1; i < arrayData.length; i++) {
        const row = arrayData[i];
        const obj = {};
        
        for (let j = 0; j < headers.length; j++) {
            if (headers[j] && row[j] !== undefined) {
                obj[headers[j]] = row[j];
            } else {
                // Tạo key cho các cột empty (__EMPTY, __EMPTY_1, ...)
                const emptyKey = `__EMPTY${j > 0 ? `_${j}` : ''}`;
                obj[emptyKey] = row[j];
            }
        }
        
        result.push(obj);
    }
    
    return result;
}

// HÀM CONVERT MỚI CHO VIETTEL - DÙNG col_index
function convertArrayToObjectForViettel(arrayData) {
    if (!arrayData || !Array.isArray(arrayData)) {
        console.log('❌ Dữ liệu đầu vào không hợp lệ');
        return [];
    }
    
    const result = [];
    
    try {
        for (let i = 0; i < arrayData.length; i++) {
            const row = arrayData[i];
            
            if (!row || typeof row !== 'object') {
                continue;
            }
            
            const obj = {};
            
            if (Array.isArray(row)) {
                for (let j = 0; j < row.length; j++) {
                    obj[`col_${j}`] = row[j];
                }
            } else {
                Object.assign(obj, row);
            }
            
            result.push(obj);
        }
        
        console.log(`✅ Đã tạo ${result.length} object từ ${arrayData.length} dòng`);
        return result;
        
    } catch (error) {
        console.log(`❌ Lỗi convert: ${error.message}`);
        return [];
    }
}
        // HIỂN THỊ KẾT QUẢ
        function displayResults(result) {
            const summary = document.getElementById('resultSummary');
            const newProducts = document.getElementById('newProductsList');
            
            summary.innerHTML = `
                <div class="info">
                    <h4>📊 Báo cáo chuyển đổi:</h4>
                    <p>✅ Tổng số bản ghi: ${result.summary.totalRecords}</p>
                    <p>🔗 Sản phẩm mapping được: ${result.summary.mappedProducts}</p>
                    <p>🆕 Sản phẩm mới tạo: ${result.summary.newProducts}</p>
                </div>
            `;
            
            if (result.newProducts.length > 0) {
                let newProductsHTML = '<div class="warning"><h4>📝 Danh sách sản phẩm mới (cần thêm vào MISA):</h4><ul>';
                result.newProducts.forEach(product => {
                    newProductsHTML += `<li><strong>${product.code}</strong>: ${product.name}</li>`;
                });
                newProductsHTML += '</ul></div>';
                newProducts.innerHTML = newProductsHTML;
            } else {
                newProducts.innerHTML = '<div class="success">✅ Tất cả sản phẩm đều mapping được với MISA</div>';
            }
        }

        // DOWNLOAD FILE MISA
        document.getElementById('downloadBtn').addEventListener('click', function() {
            if (!conversionResult) return;
            
            const wb = XLSX.utils.book_new();
            const misaColumns = [
                'Hiển thị trên sổ', 'Hình thức bán hàng', 'Phương thức thanh toán', 
                'Kiêm phiếu xuất kho', 'XK vào khu phi thuế quan và các TH được coi như XK',
                'Lập kèm hóa đơn', 'Đã lập hóa đơn', 'Ngày hạch toán (*)', 'Ngày chứng từ (*)',
                'Số chứng từ (*)', 'Số phiếu xuất', 'Lý do xuất', 'Số hóa đơn', 'Ngày hóa đơn',
                'Mã khách hàng', 'Tên khách hàng', 'Địa chỉ', 'Mã số thuế', 'Diễn giải',
                'Nộp vào TK', 'NV bán hàng', 'Mã hàng (*)', 'Tên hàng', 'Hàng khuyến mại',
                'TK Tiền/Chi phí/Nợ (*)', 'TK Doanh thu/Có (*)', 'ĐVT', 'Số lượng',
                'Đơn giá sau thuế', 'Đơn giá', 'Thành tiền', 'Tỷ lệ CK (%)', 'Tiền chiết khấu',
                'TK chiết khấu', 'Giá tính thuế XK', '% thuế XK', 'Tiền thuế XK', 'TK thuế XK',
                '% thuế GTGT', 'Tỷ lệ tính thuế (Thuế suất KHAC)', 'Tiền thuế GTGT', 'TK thuế GTGT',
                'HH không TH trên tờ khai thuế GTGT', 'Kho', 'TK giá vốn', 'TK Kho', 'Đơn giá vốn',
                'Tiền vốn', 'Hàng hóa giữ hộ/bán hộ'
            ];
            
            const dataWithCorrectOrder = conversionResult.data.map(row => {
                const orderedRow = {};
                misaColumns.forEach(col => {
                    orderedRow[col] = row[col] || '';
                });
                return orderedRow;
            });
            
            const ws = XLSX.utils.json_to_sheet(dataWithCorrectOrder, { header: misaColumns });
            const colWidths = misaColumns.map(col => ({ width: 15 }));
            ws['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(wb, ws, 'ChungTuBanHang');
            XLSX.writeFile(wb, 'MISA_ChuyenDoi.xlsx');
        });

        /////////////////////////////////////////////////

// HÀM PHÂN LOẠI FILE VÀ XỬ LÝ
function classifyAndProcessFile(fileData, workbook) {
    let fileContent = '';
    
    // Đọc toàn bộ nội dung file để tìm keyword
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        
        // Quét các ô đầu tiên để tìm keyword
        for (let R = range.s.r; R <= Math.min(range.s.r + 10, range.e.r); R++) {
            for (let C = range.s.c; C <= Math.min(range.s.c + 10, range.e.c); C++) {
                const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
                const cell = sheet[cellAddress];
                if (cell && cell.v) {
                    fileContent += cell.v.toString() + ' ';
                }
            }
        }
    });
    
    console.log('🔍 Quét keyword trong file:', fileContent.substring(0, 200));
    
    // PHÂN LOẠI FILE
    if (fileContent.includes('PHỤ LỤC') || fileContent.includes('PHU LUC')) {
        console.log('✅ Nhận diện: File VNPT (có PHỤ LỤC)');
        return processVNPTFile(fileData, workbook);
    } else {
        console.log('✅ Nhận diện: File VIETTEL');
        return processViettelFile(fileData, workbook);
    }
}

// HÀM TẠO MÃ KHÁCH HÀNG TỪ TÊN
function generateCustomerCode(customerName, existingCodes = new Set()) {
    if (!customerName || customerName.trim() === '') {
        return 'KH0001';
    }
    
    // Chuẩn hóa tên: loại bỏ dấu, chuyển thành chữ hoa
    const normalizedName = customerName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .toUpperCase()
        .replace(/[^A-Z\s]/g, '') // Chỉ giữ chữ cái và khoảng trắng
        .trim();
    
    // Tách thành các từ
    const words = normalizedName.split(/\s+/).filter(word => word.length > 0);
    
    let code = '';
    
    if (words.length >= 5) {
        // Lấy ký tự đầu của 5 từ đầu tiên
        code = words.slice(0, 5).map(word => word.charAt(0)).join('');
    } else {
        // Lấy ký tự đầu của tất cả từ + bổ sung từ cuối cùng
        const firstChars = words.map(word => word.charAt(0)).join('');
        const lastWord = words[words.length - 1];
        
        if (firstChars.length < 5) {
            // Lấy thêm ký tự từ từ cuối cùng
            const neededChars = 5 - firstChars.length;
            const additionalChars = lastWord.substring(1, 1 + neededChars);
            code = firstChars + additionalChars;
        } else {
            code = firstChars.substring(0, 5);
        }
    }
    
    // Đảm bảo mã có đúng 5 ký tự
    code = code.padEnd(5, 'X').substring(0, 5);
    
    // Kiểm tra trùng lặp và tạo mã mới nếu cần
    let finalCode = code;
    let counter = 1;
    
    while (existingCodes.has(finalCode)) {
        finalCode = code.substring(0, 4) + counter;
        counter++;
        if (counter > 9) {
            finalCode = code.substring(0, 3) + counter;
        }
        if (counter > 99) {
            finalCode = code.substring(0, 2) + counter;
        }
    }
    
    existingCodes.add(finalCode);
    return finalCode;
}

// BIẾN TOÀN CỤC ĐỂ THEO DÕI MÃ KHÁCH HÀNG ĐÃ TẠO
let customerCodeMap = new Map();
let customerCodeCounter = new Set();
// HÀM PARSE FILE VIETTEL - GIỮ NGUYÊN ĐỊNH DẠNG SỐ
// HÀM PARSE FILE VIETTEL - GIỮ NGUYÊN ĐỊNH DẠNG SỐ
function parseViettelFileData(jsonData) {
    const realData = [];
    
    console.log('🔍 Phân tích file Viettel - Giữ nguyên định dạng số');

    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        const rowValues = Object.values(row);
        const rowString = rowValues.join(' ');
        
        // Bỏ qua dòng trống hoặc header
        if (rowString.includes('STT') || rowString.includes('Số hóa đơn') || 
            rowString.includes('Tên hàng hóa') || rowString.trim() === '') {
            continue;
        }
        
        // KIỂM TRA NẾU DÒNG BỊ CQT TỪ CHỐI CẤP MÃ
        if (rowString.includes('CQT từ chối cấp mã')) {
            console.log(`⏭️ Bỏ qua dòng ${i}: CQT từ chối cấp mã`);
            continue; // Bỏ qua dòng này
        }
        
        // MAP CHÍNH XÁC TỪ FILE - GIỮ NGUYÊN ĐỊNH DẠNG
        const soHoaDon = row['col_3'];
        const tenHang = row['col_15'];
        const soLuong = row['col_18']; 
        const donGia = row['col_19'];
        const doanhSo = row['col_21'];
        const thueGTGT = row['col_28'];
        const thueSuat = row['col_25'];
        const ngayHoaDon = row['col_4'];
        const tenNguoiMua = row['col_7'];
        const maSoThue = row['col_9'];
        
        if (soHoaDon && tenHang) {
            console.log(`✅ Dòng ${i}: HD ${soHoaDon} - ${tenHang}`);
            
            // HÀM CHUYỂN ĐỔI SỐ AN TOÀN - GIỮ NGUYÊN GIÁ TRỊ GỐC
            const safeParseNumber = (value) => {
                if (!value) return 0;
                
                // Nếu là số rồi thì trả về luôn
                if (typeof value === 'number') return value;
                
                // Nếu là string, xử lý dấu phân cách
                const strValue = value.toString().trim();
                
                // Loại bỏ dấu phân cách hàng nghìn, giữ nguyên dấu thập phân
                const cleanValue = strValue
                    .replace(/\./g, '') // Loại bỏ dấu chấm phân cách hàng nghìn (1.000 -> 1000)
                    .replace(/,/g, '.'); // Chuyển dấu phẩy thập phân thành chấm (0,5 -> 0.5)
                
                const numValue = parseFloat(cleanValue);
                return isNaN(numValue) ? 0 : numValue;
            };
            
            const mappedRow = {
                'STT': realData.length + 1,
                'SoHoaDon': soHoaDon.toString().trim(),
                'MatHang': tenHang.toString().trim(),
                'SoLuong': safeParseNumber(soLuong),
                'DonGia': safeParseNumber(donGia),
                'DoanhSo': safeParseNumber(doanhSo), // GIỮ ĐÚNG 730,909.00 -> 730909.00
                'ThueGTGT': safeParseNumber(thueGTGT),
                'NgayHoaDon': ngayHoaDon ? ngayHoaDon.toString().trim() : '',
                'TenNguoiMua': tenNguoiMua ? tenNguoiMua.toString().trim() : 'Khách hàng Viettel',
                'MST': maSoThue ? maSoThue.toString().trim() : '',
                'TaxRate': thueSuat ? thueSuat.toString().replace('%', '').replace('.0', '') : '10',
                'FileType': 'VIETTEL',
                'RawIndex': i,
                // Lưu giá trị gốc để debug
                '_OriginalValues': {
                    'DonGia': donGia,
                    'DoanhSo': doanhSo,
                    'ThueGTGT': thueGTGT
                }
            };
            
            // DEBUG: Kiểm tra chuyển đổi số
            if (doanhSo && doanhSo.toString() !== mappedRow.DoanhSo.toString()) {
                console.log(`🔢 Chuyển đổi số: "${doanhSo}" -> ${mappedRow.DoanhSo}`);
            }
            
            realData.push(mappedRow);
        }
    }
    
    console.log(`✅ Đã trích xuất ${realData.length} bản ghi từ Viettel`);
    return realData;
}
function findLastDataLines(jsonData, count = 5) {
    console.log('🔍 Tìm các dòng dữ liệu cuối cùng:');
    const dataLines = [];
    
    for (let i = Math.max(0, jsonData.length - 10); i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowValues = Object.values(row).filter(val => val && val.toString().trim() !== '');
        
        if (rowValues.length > 3) {
            dataLines.push({ index: i, values: rowValues });
        }
    }
    
    dataLines.forEach(line => {
        console.log(`Dòng ${line.index}:`, line.values.slice(0, 5));
    });
}

function debugFileStructure(jsonData) {
    console.log('🔍 DEBUG CẤU TRÚC FILE:');
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        console.log(`Dòng ${i}:`, {
            values: Object.values(row),
            keys: Object.keys(row),
            raw: row
        });
    }
    
    // Tìm tất cả các tên cột có trong file
    const allColumns = new Set();
    jsonData.forEach(row => {
        Object.keys(row).forEach(key => allColumns.add(key));
    });
    console.log('📋 Tất cả các cột trong file:', Array.from(allColumns));
}

// HÀM PROCESS VNPT - DÙNG CONVERT CŨ
function processVNPTFile(fileData, workbook) {
    console.log('🔧 Bắt đầu xử lý file VNPT');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // DÙNG HÀM CONVERT CŨ CHO VNPT
    const jsonData = convertArrayToObjectForVNPT(rawData);
    
    const vnptData = parseVNPTFileData(jsonData);
    
    console.log(`✅ Đã trích xuất ${vnptData.length} bản ghi từ file VNPT`);
    return vnptData;
}

// HÀM PROCESS VIETTEL - DÙNG CONVERT MỚI
function processViettelFile(fileData, workbook) {
    console.log('🔧 Bắt đầu xử lý file Viettel');
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // DÙNG HÀM CONVERT MỚI CHO VIETTEL
    const jsonData = convertArrayToObjectForViettel(rawData);
    const viettelData = parseViettelFileData(jsonData);
    
    console.log(`✅ Kết quả: ${viettelData.length} bản ghi`);
    return viettelData;
}
